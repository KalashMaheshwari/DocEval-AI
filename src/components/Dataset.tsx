import { useState, MouseEvent } from 'react';
import { EvaluationRecord } from '../types';
import { FileCode2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Search, Download, FileText, Filter } from 'lucide-react';

type ComplexitySort = 'default' | 'asc' | 'desc';
type FilterMode = 'all' | 'failures' | 'Small' | 'Medium' | 'Large';

interface ActiveTooltip {
  notes: string;
  failedMetrics: string[];
  x: number;
  y: number;
}

export default function Dataset({ data }: { data: EvaluationRecord[] }) {
  const [complexitySort, setComplexitySort] = useState<ComplexitySort>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-100 text-emerald-700';
    if (score === 3) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getFailedMetrics = (scores: EvaluationRecord['scores']) => {
    const failed: string[] = [];
    if (scores.accuracy <= 2) failed.push(`Accuracy (${scores.accuracy}/5)`);
    if (scores.completeness <= 2) failed.push(`Completeness (${scores.completeness}/5)`);
    if (scores.hallucination <= 2) failed.push(`Hallucination (${scores.hallucination}/5)`);
    if (scores.structure <= 2) failed.push(`Structure (${scores.structure}/5)`);
    if (scores.scope <= 2) failed.push(`Scope (${scores.scope}/5)`);
    return failed;
  };

  const handleComplexitySort = () => {
    if (complexitySort === 'default') setComplexitySort('asc');
    else if (complexitySort === 'asc') setComplexitySort('desc');
    else setComplexitySort('default');
  };

  const complexityWeight: Record<string, number> = {
    Small: 1,
    Medium: 2,
    Large: 3,
  };

  // Filter & Search Logic
  const filteredData = data.filter((record) => {
    // Search query matching
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = record.repoName.toLowerCase().includes(q);
      const matchNotes = record.notes.toLowerCase().includes(q);
      if (!matchName && !matchNotes) return false;
    }

    // Filter mode matching
    if (filterMode === 'failures') {
      return getFailedMetrics(record.scores).length > 0;
    }
    if (filterMode === 'Small' || filterMode === 'Medium' || filterMode === 'Large') {
      return record.repoComplexity === filterMode;
    }

    return true;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (complexitySort === 'asc') {
      return (complexityWeight[a.repoComplexity] || 0) - (complexityWeight[b.repoComplexity] || 0);
    }
    if (complexitySort === 'desc') {
      return (complexityWeight[b.repoComplexity] || 0) - (complexityWeight[a.repoComplexity] || 0);
    }
    // Default: Newest first
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  // Export JSON
  const exportJSON = () => {
    const jsonStr = JSON.stringify(sortedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-eval-dataset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Repository', 'Complexity', 'Accuracy', 'Completeness', 'Hallucination', 'Structure', 'Scope', 'Notes'];
    const rows = sortedData.map((r) => [
      r.id,
      `"${r.repoName.replace(/"/g, '""')}"`,
      r.repoComplexity,
      r.scores.accuracy,
      r.scores.completeness,
      r.scores.hallucination,
      r.scores.structure,
      r.scores.scope,
      `"${r.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-eval-dataset-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMouseEnterIcon = (e: MouseEvent<HTMLSpanElement>, notes: string, failedMetrics: string[]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 320;
    let x = rect.right - popupWidth;
    if (x < 16) x = 16;
    if (x + popupWidth > window.innerWidth - 16) x = window.innerWidth - popupWidth - 16;

    let y = rect.bottom + 8;
    if (y + 180 > window.innerHeight) {
      y = rect.top - 180;
    }

    setActiveTooltip({
      notes,
      failedMetrics,
      x,
      y,
    });
  };

  const failureCount = data.filter((r) => getFailedMetrics(r.scores).length > 0).length;

  return (
    <div className="space-y-6 relative">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Annotated Dataset</h1>
          <p className="text-slate-500 text-lg">Raw evaluation data across {data.length} repositories.</p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Download full benchmark dataset as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Download dataset as CSV spreadsheet"
          >
            <FileText className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repository or annotation notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <div className="flex items-center gap-1 text-slate-400 text-xs mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter:</span>
          </div>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({data.length})
          </button>

          <button
            onClick={() => setFilterMode('failures')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'failures'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Failures ({failureCount})
          </button>

          {(['Small', 'Medium', 'Large'] as const).map((comp) => (
            <button
              key={comp}
              onClick={() => setFilterMode(comp)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterMode === comp
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-700">Repository</th>
                <th 
                  onClick={handleComplexitySort}
                  className="p-4 font-medium text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  title="Click to sort by Complexity (Small -> Medium -> Large)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Complexity</span>
                    {complexitySort === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : complexitySort === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-medium text-slate-700 text-center">Acc</th>
                <th className="p-4 font-medium text-slate-700 text-center">Comp</th>
                <th className="p-4 font-medium text-slate-700 text-center">Hall</th>
                <th className="p-4 font-medium text-slate-700 text-center">Struc</th>
                <th className="p-4 font-medium text-slate-700 text-center">Scope</th>
                <th className="p-4 font-medium text-slate-700 min-w-[320px]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    No matching repositories found. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                sortedData.map((record) => {
                  const failedMetrics = getFailedMetrics(record.scores);
                  const hasFailure = failedMetrics.length > 0;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-medium text-indigo-600">
                          <FileCode2 className="w-4 h-4" />
                          <span>{record.repoName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {record.repoComplexity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${getScoreColor(record.scores.accuracy)}`}>
                          {record.scores.accuracy}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${getScoreColor(record.scores.completeness)}`}>
                          {record.scores.completeness}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${getScoreColor(record.scores.hallucination)}`}>
                          {record.scores.hallucination}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${getScoreColor(record.scores.structure)}`}>
                          {record.scores.structure}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${getScoreColor(record.scores.scope)}`}>
                          {record.scores.scope}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 min-w-[320px] max-w-lg whitespace-normal break-words">
                        {hasFailure ? (
                          <div className="flex items-start gap-2.5 text-rose-700">
                            {/* Danger Sign Icon with Viewport-level Fixed Tooltip */}
                            <span 
                              onMouseEnter={(e) => handleMouseEnterIcon(e, record.notes, failedMetrics)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              className="inline-flex items-center justify-center bg-rose-100 text-rose-700 p-1.5 rounded-md hover:bg-rose-200 transition-colors shadow-xs cursor-pointer shrink-0 mt-0.5"
                              title="Hover for breakdown"
                            >
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            </span>

                            <span className="font-medium text-xs leading-relaxed text-rose-900">{record.notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs leading-relaxed block">{record.notes}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-slate-500">
        <div>Showing {sortedData.length} of {data.length} entries</div>
        <div>* Acc = Accuracy, Comp = Completeness, Hall = Hallucination, Struc = Structure, Scope = Scope</div>
      </div>

      {/* Global Fixed Hover Popover Card - Bypasses Table Overflow Clipping Entirely */}
      {activeTooltip && (
        <div 
          style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y}px` }}
          className="fixed w-80 p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs z-[99999] pointer-events-none whitespace-normal leading-relaxed animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-2 uppercase tracking-wider text-[11px]">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            Model Failure Mode Detected
          </div>
          <div className="mb-2 text-slate-300 font-medium bg-slate-800/80 p-2 rounded border border-slate-700/50">
            Triggered: <span className="text-rose-300 font-semibold">{activeTooltip.failedMetrics.join(', ')}</span>
          </div>
          <div className="text-slate-200 leading-normal">
            {activeTooltip.notes}
          </div>
        </div>
      )}
    </div>
  );
}
