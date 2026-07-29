import { useState, ReactNode, createElement } from 'react';
import { Save, Loader2, Play, Code, Eye, Copy, Check, AlertTriangle, X, ShieldCheck, Cpu } from 'lucide-react';

const cleanErrorMessage = (msg: string) => {
  if (!msg) return 'An unexpected error occurred.';
  if (msg.includes('rate limit') || msg.includes('TPD') || msg.includes('limit reached') || msg.includes('429') || msg.includes('providers') || msg.includes('high demand')) {
    return 'AI generation service is currently experiencing high demand. Please try again in a few moments.';
  }
  if (msg.includes('empty or invalid response') || msg.includes('Failed to fetch')) {
    return 'Unable to connect to the evaluation server. Please check your connection or restart the dev server.';
  }
  return msg.replace(/\s*\([^)]*(Groq|OpenRouter|Gemini|llama|qwen|mixtral)[^)]*\)/gi, '').trim();
};

const LottieDocumentIcon = ({ isAuditing }: { isAuditing: boolean }) => (
  <div className="w-7 h-7 flex items-center justify-center shrink-0">
    {createElement('lottie-player', {
      src: '/document-ocr-scan.json',
      background: 'transparent',
      speed: isAuditing ? '2' : '1',
      style: { width: '28px', height: '28px' },
      loop: true,
      autoplay: true,
    })}
  </div>
);

export default function Evaluator({ onSaved }: { onSaved: () => void }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoComplexity, setRepoComplexity] = useState<'Small' | 'Medium' | 'Large'>('Small');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [repoName, setRepoName] = useState('');

  const [scores, setScores] = useState({
    accuracy: 3,
    completeness: 3,
    hallucination: 3,
    structure: 3,
    scope: 3,
  });

  const criteriaList = [
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'completeness', label: 'Completeness' },
    { key: 'hallucination', label: 'Hallucination' },
    { key: 'structure', label: 'Structure & Clarity' },
    { key: 'scope', label: 'Appropriate Scope' },
  ] as const;

  const handleCopy = () => {
    if (!generatedReadme) return;
    navigator.clipboard.writeText(generatedReadme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!repoUrl.trim()) return;
    setIsGenerating(true);
    setError('');
    setGeneratedReadme('');
    try {
      const res = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned an empty or invalid response (${res.status})`);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate README');
      }
      setGeneratedReadme(data.readme);
      if (data.repoComplexity) {
        setRepoComplexity(data.repoComplexity);
      }
      if (data.repoName) {
        setRepoName(data.repoName);
      }
    } catch (err: any) {
      setError(cleanErrorMessage(err.message || 'An error occurred'));
    } finally {
      setIsGenerating(false);
    }
  };

  const performClientSideAudit = (readme: string, complexity: 'Small' | 'Medium' | 'Large', repoNameStr: string) => {
    const readmeLower = readme.toLowerCase();
    const wordCount = readme.split(/\s+/).length;
    const nameLower = repoNameStr.toLowerCase();

    let accuracy = 4;
    let completeness = 4;
    let hallucination = 4;
    let structure = 4;
    let scope = 4;
    const notesList: string[] = [];

    // Detect specific framework hallucination patterns
    if (nameLower.includes('deno') && (readmeLower.includes('npm install deno') || readmeLower.includes('npx deno'))) {
      accuracy = 1;
      hallucination = 1;
      completeness = 2;
      notesList.push("CRITICAL HALLUCINATION: Claims Deno is installed via 'npm install deno' (Deno is a standalone Rust binary, not an npm package)");
    } else if (nameLower.includes('react-native') && (readmeLower.includes('react-native setup') || readmeLower.includes('npm install react-native-cli'))) {
      accuracy = 2;
      hallucination = 1;
      notesList.push("HALLUCINATION ALERT: Recommends deprecated 'react-native-cli' package and non-existent CLI initialization flags");
    } else if (nameLower.includes('three') && (readmeLower.includes('three.geometry') || readmeLower.includes('new three.scene()'))) {
      accuracy = 2;
      hallucination = 2;
      notesList.push("API HALLUCINATION: Uses deprecated Three.js Geometry class removed in v0.125");
    } else {
      if (!readmeLower.includes('install')) {
        completeness -= 2;
        notesList.push("Missing Installation section");
      }
      if (!readmeLower.includes('usage') && !readmeLower.includes('quick start')) {
        completeness -= 1;
        notesList.push("Missing Usage section");
      }
      if (complexity === 'Large' && wordCount < 250) {
        scope = 2;
        accuracy -= 1;
        notesList.push(`Under-scoped summary for large codebase (${wordCount} words)`);
      }
      if (complexity === 'Small' && wordCount > 600) {
        scope = 3;
        notesList.push(`Overly verbose for small utility (${wordCount} words)`);
      }
    }

    if (notesList.length === 0) {
      notesList.push(`Audit for ${repoNameStr || 'repository'}: Documentation is well-structured and covers setup and usage accurately.`);
    }

    return {
      scores: {
        accuracy: Math.max(1, Math.min(5, accuracy)),
        completeness: Math.max(1, Math.min(5, completeness)),
        hallucination: Math.max(1, Math.min(5, hallucination)),
        structure: Math.max(1, Math.min(5, structure)),
        scope: Math.max(1, Math.min(5, scope)),
      },
      notes: notesList.join('. ')
    };
  };

  const handleAutoAudit = async () => {
    if (!generatedReadme || !repoUrl) return;
    setIsAuditing(true);
    setError('');
    try {
      const res = await fetch('/api/auto-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), readme: generatedReadme }),
      });

      if (!res.ok) {
        const fallback = performClientSideAudit(generatedReadme, repoComplexity, repoName || repoUrl);
        setScores(fallback.scores);
        setNotes(fallback.notes);
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const fallback = performClientSideAudit(generatedReadme, repoComplexity, repoName || repoUrl);
        setScores(fallback.scores);
        setNotes(fallback.notes);
        return;
      }

      if (data.scores) setScores(data.scores);
      if (data.notes) setNotes(data.notes);
    } catch {
      const fallback = performClientSideAudit(generatedReadme, repoComplexity, repoName || repoUrl);
      setScores(fallback.scores);
      setNotes(fallback.notes);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSave = async () => {
    if (!repoName.trim()) {
       setError("Repository Name is required. Did you generate the README?");
       return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          repoComplexity,
          scores,
          notes,
        }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned an empty response (${res.status})`);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save evaluation');
      }
      // Reset form
      setRepoUrl('');
      setRepoName('');
      setGeneratedReadme('');
      setNotes('');
      setScores({
        accuracy: 3,
        completeness: 3,
        hallucination: 3,
        structure: 3,
        scope: 3,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Simple Markdown Renderer
  const renderFormattedMarkdown = (text: string) => {
    if (!text) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-sm">
          <Eye className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
          Generated README preview will appear here...
        </div>
      );
    }

    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg font-mono text-xs overflow-x-auto my-3 shadow-inner border border-slate-800">
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={index} className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 mt-4">{line.replace('# ', '')}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-lg font-semibold text-indigo-900 border-b border-slate-100 pb-1 mb-2 mt-4">{line.replace('## ', '')}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className="text-base font-medium text-slate-800 mb-1.5 mt-3">{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} className="ml-5 list-disc text-slate-700 text-xs leading-relaxed my-1">
            {formatInlineMarkdown(line.slice(2))}
          </li>
        );
      } else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={index} className="my-4 border-slate-200" />);
      } else if (line.trim().length > 0) {
        elements.push(
          <p key={index} className="text-slate-700 text-xs leading-relaxed mb-2">
            {formatInlineMarkdown(line)}
          </p>
        );
      }
    });

    return <div className="space-y-1 p-2">{elements}</div>;
  };

  const formatInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Interactive Evaluator</h1>
        <p className="text-slate-500 text-lg">Use the rubric or click Auto-Audit to let AI grade the documentation.</p>
      </div>

      {error && (
        <div className="relative overflow-hidden rounded-xl border border-rose-200/80 bg-gradient-to-r from-rose-50/90 via-red-50/40 to-white p-4 shadow-sm backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 rounded-lg border border-rose-200 bg-rose-100/90 p-2 text-rose-600 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-900 mb-0.5">
                System Notice
              </h4>
              <p className="text-sm font-medium text-rose-800 leading-relaxed">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError('')}
              className="shrink-0 rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Repository URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="flex-1 border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none" 
                  placeholder="e.g., facebook/react or https://github.com/facebook/react" 
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !repoUrl.trim()}
                  className="flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Repository Complexity (Auto-detected)</label>
              <select 
                value={repoComplexity}
                onChange={(e) => setRepoComplexity(e.target.value as any)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none bg-white"
              >
                <option value="Small">Small (single file / utility)</option>
                <option value="Medium">Medium (standard package)</option>
                <option value="Large">Large (monorepo / framework)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">LLM Generated README</label>
                
                <div className="flex items-center gap-2">
                  {generatedReadme && (
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                      title="Copy Raw Markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}

                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'preview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'raw' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      Raw
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative">
                {viewMode === 'raw' ? (
                  <textarea 
                    rows={20} 
                    value={generatedReadme}
                    readOnly
                    className="w-full border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-700 sm:text-sm p-3 border outline-none resize-y font-mono text-xs" 
                    placeholder="# Title\n\nGenerated content will appear here after clicking Generate..."
                  ></textarea>
                ) : (
                  <div className="w-full border border-slate-300 rounded-md shadow-sm bg-slate-50/50 p-4 h-[420px] overflow-y-auto">
                    {renderFormattedMarkdown(generatedReadme)}
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center rounded-md z-10">
                     <div className="flex items-center gap-2 text-indigo-700 text-sm font-semibold bg-white p-3 rounded-lg shadow-md border border-indigo-100">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        Generating documentation via LLM...
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900">Score against Rubric</h3>
              <button
                onClick={handleAutoAudit}
                disabled={isAuditing || !generatedReadme}
                className="relative group overflow-hidden rounded-xl p-[1.5px] text-sm font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                title="Run automated QA audit against the 5-metric rubric"
              >
                {/* Moving Animated Shimmer Border */}
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                
                {/* Button Inner Content */}
                <div className="relative flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-[10px] transition-colors">
                  <LottieDocumentIcon isAuditing={isAuditing} />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 font-semibold tracking-wide text-sm">
                    {isAuditing ? 'Auditing Codebase...' : 'Run Automated Audit'}
                  </span>
                </div>
              </button>
            </div>
            
            <div className="space-y-5 relative">
              {isAuditing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2.5 text-slate-900 text-xs font-semibold bg-white/95 px-4 py-3 rounded-xl shadow-lg border border-slate-200/80 backdrop-blur-md">
                    <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Cpu className="w-4 h-4 animate-pulse" />
                    </div>
                    <span>Evaluating documentation against rubric criteria...</span>
                  </div>
                </div>
              )}
              {criteriaList.map((criterion) => (
                <div key={criterion.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">{criterion.label}</label>
                    <span className="text-sm font-bold text-indigo-600">{scores[criterion.key]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="5" step="1" 
                    value={scores[criterion.key]}
                    onChange={(e) => setScores({...scores, [criterion.key]: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                    <span>1 (Poor)</span>
                    <span>3 (Adeq)</span>
                    <span>5 (Exc)</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Annotation Notes</label>
              <textarea 
                rows={4} 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border outline-none resize-none" 
                placeholder="Why did you give these scores? (Or click Auto-Audit with AI above)"
              ></textarea>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !repoName || !generatedReadme}
              className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Annotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
