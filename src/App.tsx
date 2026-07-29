/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TabType, EvaluationRecord } from './types';
import Overview from './components/Overview';
import Rubric from './components/Rubric';
import Dataset from './components/Dataset';
import Analysis from './components/Analysis';
import Evaluator from './components/Evaluator';
import { FileText, ListChecks, Database, BarChart3, Edit3, Info, FileCheck } from 'lucide-react';
import logoImg from './assets/logo-optimized.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluations');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      }
    } catch (err) {
      console.error("Failed to load evaluations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText, tooltip: 'Explains what this project is about and why we are evaluating LLM-generated READMEs.' },
    { id: 'rubric', label: 'Rubric', icon: ListChecks, tooltip: 'The grading criteria we use to score how well the AI generated the README.' },
    { id: 'dataset', label: 'Dataset', icon: Database, tooltip: 'The list of real GitHub repositories we tested and the scores we gave to the AI\'s output.' },
    { id: 'analysis', label: 'Analysis & Findings', icon: BarChart3, tooltip: 'Charts and detailed insights explaining the patterns we found in the AI\'s performance.' },
    { id: 'evaluator', label: 'Evaluator Tool', icon: Edit3, tooltip: 'A real working tool to fetch a GitHub repo, generate a README using AI, and grade it yourself.' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 shadow-sm z-10 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Logo" className="w-6 h-6 shrink-0 object-contain" />
            <span className="font-semibold text-slate-900 tracking-tight text-base">DocEval</span>
            <span className="text-xs font-mono font-medium text-slate-400 border-l border-slate-200 pl-2.5">bench</span>
          </div>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-visible">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`relative group/row flex items-center justify-between w-full rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <button
                onClick={() => setActiveTab(tab.id as TabType)}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium outline-none text-left"
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
              
              {/* Info Icon & Tooltip */}
              <div className="group/tooltip relative flex items-center justify-center p-2.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <Info className="w-4 h-4 text-slate-400 hover:text-indigo-600 cursor-help transition-colors" />
                
                {/* Tooltip Content */}
                <div className="absolute left-full ml-2 w-56 p-2.5 bg-slate-800 text-white text-xs leading-relaxed rounded-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all z-[100] shadow-lg top-1/2 -translate-y-1/2 text-left font-normal text-wrap">
                  {tab.tooltip}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-800"></div>
                </div>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-500">Loading dataset...</div>
          ) : (
            <>
              {activeTab === 'overview' && <Overview />}
              {activeTab === 'rubric' && <Rubric />}
              {activeTab === 'dataset' && <Dataset data={evaluations} />}
              {activeTab === 'analysis' && <Analysis data={evaluations} />}
              {activeTab === 'evaluator' && <Evaluator onSaved={fetchEvaluations} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

