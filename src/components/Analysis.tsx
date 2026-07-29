import { EvaluationRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export default function Analysis({ data }: { data: EvaluationRecord[] }) {
  // Calculate averages
  const keys = ['accuracy', 'completeness', 'hallucination', 'structure', 'scope'] as const;
  
  const avgScores = keys.map(key => ({
    metric: key.charAt(0).toUpperCase() + key.slice(1),
    score: data.length ? Number((data.reduce((sum, r) => sum + r.scores[key], 0) / data.length).toFixed(2)) : 0
  }));

  // Average by complexity
  const complexities = ['Small', 'Medium', 'Large'] as const;
  const complexityData = complexities.map(c => {
    const subset = data.filter(r => r.repoComplexity === c);
    const avgHallucination = subset.length ? subset.reduce((sum, r) => sum + r.scores.hallucination, 0) / subset.length : 0;
    const avgAccuracy = subset.length ? subset.reduce((sum, r) => sum + r.scores.accuracy, 0) / subset.length : 0;
    return {
      complexity: c,
      Hallucination: Number(avgHallucination.toFixed(2)),
      Accuracy: Number(avgAccuracy.toFixed(2)),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Findings & Analysis</h1>
        <p className="text-slate-500 text-lg">Patterns observed across the {data.length} annotated outputs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-6">Average Scores by Criterion</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={avgScores}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Average Score" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-6">Performance Degradation by Complexity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complexityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="complexity" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="Hallucination" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
           <div className="border-b border-slate-200 bg-slate-50 p-6">
             <h3 className="text-xl font-medium text-slate-900 mb-2">Key Finding 1: The "Large Repo" Hallucination Spike</h3>
             <p className="text-slate-600">
               There is a strong inverse correlation between repository complexity and the <strong>Hallucination</strong> score. 
               While the model perfectly grounds its output for Small repositories (avg: {complexityData.find(d => d.complexity === 'Small')?.Hallucination || 0}), it drops significantly for Large repos (avg: {complexityData.find(d => d.complexity === 'Large')?.Hallucination || 0}).
               Large codebases provide too much surface area for the context window, causing the LLM to fall back on its pre-trained weights to guess standard architectural patterns.
             </p>
           </div>
           <div className="p-6 bg-white">
             <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
               <div className="font-medium text-slate-800 mb-1">Observed Failure Mode: Technology Assumption</div>
               <p className="text-sm text-slate-600">In complex repositories, the model often infers dependencies that aren't there. For instance, if a repository is named 'ecommerce-frontend' but is a plain Vite app, the model might confidently generate installation steps for Next.js and hallucinate SSR routing features because that is statistically common in its training data for ecommerce frontends.</p>
             </div>
           </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
           <div className="border-b border-slate-200 bg-slate-50 p-6">
             <h3 className="text-xl font-medium text-slate-900 mb-2">Key Finding 2: Structural Consistency Masks Inaccuracies</h3>
             <p className="text-slate-600">
               Across all sizes, the <strong>Structure & Clarity</strong> metric remained the highest and most consistent (Avg: {avgScores.find(s => s.metric === 'Structure')?.score || 0}). 
               The LLM is highly adept at producing standard Markdown layouts (Installation, Usage, API). However, this creates a dangerous "false sense of security".
             </p>
           </div>
           <div className="p-6 bg-white">
             <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
               <div className="font-medium text-slate-800 mb-1">Observed Failure Mode: Plausible but Incorrect APIs</div>
               <p className="text-sm text-slate-600">Because the generated Markdown is beautifully formatted with syntax-highlighted code blocks, reviewers are more likely to skim and approve it. We found multiple instances where a function's arguments were reversed or entirely fabricated, but presented in a perfectly structured usage block.</p>
             </div>
           </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
           <div className="border-b border-slate-200 bg-slate-50 p-6">
             <h3 className="text-xl font-medium text-slate-900 mb-2">Key Finding 3: The Completeness vs. Accuracy Trade-off</h3>
             <p className="text-slate-600">
               When the LLM encounters a Medium or Large repository, it often attempts to be "Complete" by generating sections for all detected files. Unfortunately, this dilutes its <strong>Accuracy</strong> (Avg: {complexityData.find(d => d.complexity === 'Large')?.Accuracy || 0} for Large repos). It struggles to differentiate between internal utility files and public-facing APIs, documenting everything with equal weight.
             </p>
           </div>
           <div className="p-6 bg-white">
             <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
               <div className="font-medium text-slate-800 mb-1">Observed Failure Mode: Over-documenting Internals</div>
               <p className="text-sm text-slate-600">The model frequently documented internal helper functions (e.g., `_parseRegexHelper`) in the main API section, leading to a cluttered README that confused the actual user-facing usage of the library. Scope control is a major weakness.</p>
             </div>
           </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
           <div className="border-b border-slate-200 bg-slate-50 p-6">
             <h3 className="text-xl font-medium text-slate-900 mb-2">Key Finding 4: Inadequate Scope and Proportionality</h3>
             <p className="text-slate-600">
               The <strong>Appropriate Scope</strong> metric measures whether the README detail is proportionate to the codebase size. The LLM repeatedly failed this on both extremes: writing 10-page exhaustive tutorials for simple 1-file utilities (over-scoping), and writing brief, 2-paragraph summaries for complex monorepos (under-scoping).
             </p>
           </div>
           <div className="p-6 bg-white">
             <div className="bg-sky-50 border-l-4 border-sky-500 p-4 rounded-r-lg">
               <div className="font-medium text-slate-800 mb-1">Observed Failure Mode: Context Blindness</div>
               <p className="text-sm text-slate-600">Because the LLM only sees flat text chunks, it lacks an intuitive sense of "weight" or "density" of the overall project. It treats a 20-line regex helper with the same structural importance as a full React framework, generating excessive boilerplate (e.g., Contribution Guidelines, Codes of Conduct) for tiny scripts.</p>
             </div>
           </div>
        </div>

        <div className="bg-slate-50 shadow-sm border border-slate-200 rounded-xl p-8">
           <h3 className="text-2xl font-semibold text-slate-900 mb-4">Methodological Limitations</h3>
           <p className="text-slate-600 mb-6">
             As part of a rigorous evaluation process, it is critical to acknowledge the limitations of this specific dataset and grading framework:
           </p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <div className="font-medium text-slate-800">1. Single-Annotator Bias</div>
               <p className="text-sm text-slate-600">All annotations in this dataset were performed by a single human evaluator. Without cross-validation or inter-rater reliability (IRR) checks (e.g., Cohen's Kappa), internal baseline calibration for a "3" vs "4" may have drifted over time.</p>
             </div>
             <div className="space-y-2">
               <div className="font-medium text-slate-800">2. Sample Size Constraint</div>
               <p className="text-sm text-slate-600">The dataset consists of {data.length} repositories. While sufficient for identifying broad heuristic failures (like the Large Repo hallucination spike), this sample size is too small for strict statistical significance modeling.</p>
             </div>
             <div className="space-y-2">
               <div className="font-medium text-slate-800">3. Language Bias</div>
               <p className="text-sm text-slate-600">The evaluation was heavily scoped to JavaScript/TypeScript repositories. LLM performance characteristics—particularly structural inference—may differ wildly in ecosystems with different documentation cultures (e.g., Rust/Cargo, Go).</p>
             </div>
             <div className="space-y-2">
               <div className="font-medium text-slate-800">4. Context Window Truncation</div>
               <p className="text-sm text-slate-600">For large repositories, the file tree and `package.json` had to be truncated to fit within token limits during generation. Some observed "hallucinations" might actually be the model correctly guessing standard practices that were simply cut off from its immediate prompt context.</p>
             </div>
           </div>
        </div>

        <div className="bg-slate-900 shadow-sm border border-slate-800 rounded-xl p-8">
           <h3 className="text-2xl font-semibold text-white mb-6">Strategic Recommendations</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-800 rounded-lg p-5">
               <h4 className="text-indigo-300 font-medium mb-2">1. Inject Dependency Context</h4>
               <p className="text-slate-300 text-sm leading-relaxed">To fix hallucinated tools in large repos, pre-process the <code>package.json</code> and explicitly feed the dependencies into the prompt to ground the model and prevent technology assumptions.</p>
             </div>
             <div className="bg-slate-800 rounded-lg p-5">
               <h4 className="text-indigo-300 font-medium mb-2">2. Multi-Step Generation</h4>
               <p className="text-slate-300 text-sm leading-relaxed">For large codebases, switch to a two-step prompt: Step 1 generates an outline based on the file tree; Step 2 writes the sections iteratively. This improves completeness without sacrificing accuracy.</p>
             </div>
             <div className="bg-slate-800 rounded-lg p-5">
               <h4 className="text-indigo-300 font-medium mb-2">3. Enforce Scope Constraints</h4>
               <p className="text-slate-300 text-sm leading-relaxed">Add explicit system instructions to ignore files prefixed with <code>_</code> or located in <code>internal/</code> directories to prevent the over-documentation of private utilities.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
