export default function Rubric() {
  const criteria = [
    {
      name: 'Accuracy',
      desc: 'Factual correctness regarding the source code.',
      p1: 'Contains factually wrong statements about the codebase. Gross misunderstandings.',
      p3: 'Mostly correct, minor factual slips or slight misinterpretations.',
      p5: 'Fully accurate to the actual repository code. Flawless understanding.',
    },
    {
      name: 'Completeness',
      desc: 'Coverage of necessary documentation sections.',
      p1: 'Missing critical sections (install, usage, configuration).',
      p3: 'Covers basics, but misses some important details or edge cases.',
      p5: 'Comprehensive, covers all necessary sections and edge cases.',
    },
    {
      name: 'Hallucination',
      desc: 'Invention of non-existent features or APIs.',
      p1: 'Invents features, flags, or APIs that simply do not exist in the code.',
      p3: 'Mostly grounded, maybe one questionable claim or assumed standard practice.',
      p5: 'Fully grounded in the actual code. Zero hallucination.',
    },
    {
      name: 'Structure & Clarity',
      desc: 'Organization and readability of the markdown.',
      p1: 'Disorganized, hard to follow, broken markdown formatting.',
      p3: 'Reasonably organized, typical README flow, acceptable formatting.',
      p5: 'Exceptionally clear, logically ordered, beautifully formatted.',
    },
    {
      name: 'Appropriate Scope',
      desc: 'Detail level relative to repository complexity.',
      p1: 'Wildly over-detailed or under-detailed for the repo size.',
      p3: 'Roughly proportionate, slight imbalance in detail depth.',
      p5: 'Perfectly matched to repo size and complexity.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Evaluation Rubric</h1>
        <p className="text-slate-500 text-lg">The structured criteria used to score each generated README.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-700 w-1/5">Criterion</th>
                <th className="p-4 font-medium text-slate-700 w-1/4">1 (Poor)</th>
                <th className="p-4 font-medium text-slate-700 w-1/4">3 (Adequate)</th>
                <th className="p-4 font-medium text-slate-700 w-1/4">5 (Excellent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criteria.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-slate-500 text-xs mt-1">{c.desc}</div>
                  </td>
                  <td className="p-4 align-top text-slate-600">{c.p1}</td>
                  <td className="p-4 align-top text-slate-600">{c.p3}</td>
                  <td className="p-4 align-top text-slate-600">{c.p5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-2">Rubric Justification</h3>
        <p className="text-slate-600 leading-relaxed">
          These five criteria were selected to isolate distinct failure modes in LLM code-to-text generation. 
          <strong> Accuracy</strong> and <strong>Hallucination</strong> are split into separate metrics because a model can be factually wrong about existing code (low Accuracy) versus inventing entirely new code (high Hallucination); conflating them hides the specific model weakness. 
          <strong> Completeness</strong> ensures the model doesn't just summarize but actually produces a usable artifact. 
          <strong> Structure</strong> evaluates the model's formatting instruction adherence, and <strong>Scope</strong> acts as a meta-metric for the model's contextual awareness—a 200-line utility script does not need a 10-page README. This multi-dimensional approach prevents a "vibe-based" overall score and enables targeted pipeline improvements.
        </p>
      </div>
    </div>
  );
}
