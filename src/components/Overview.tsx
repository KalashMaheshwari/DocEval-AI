export default function Overview() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">DocEval AI: LLM Documentation Evaluation Framework</h1>
        <p className="text-slate-500 text-base leading-relaxed">
          DocEval AI is a benchmark platform for auditing LLM-generated technical documentation. It evaluates repository READMEs across a 5-metric rubric (Accuracy, Completeness, Hallucination, Structure, Scope), featuring human-annotated evaluations, qualitative failure mode isolation, and dataset export.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 space-y-6">
        <section>
          <h2 className="text-xl font-medium text-slate-800 mb-3">1. Domain & Scope</h2>
          <p className="text-slate-600 leading-relaxed">
            The domain for this evaluation is <strong>LLM-generated README files for small-to-medium open-source JavaScript/TypeScript repositories</strong>. 
            The model is tasked with taking raw source code and producing a comprehensive, accurate, and well-structured README.md file that developers can use to understand, install, and contribute to the project.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-slate-800 mb-3">2. What "Good" Looks Like</h2>
          <p className="text-slate-600 leading-relaxed">
            A high-quality generated README accurately reflects the codebase's purpose, public APIs, and installation steps without inventing features that do not exist in the source code. 
            It provides just enough detail proportionate to the repository's size—avoiding overly verbose explanations for simple utility libraries, while ensuring critical configuration steps are not missed for complex applications. 
            It is logically structured (e.g., Installation, Usage, API, Contributing) and easy to scan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-slate-800 mb-3">3. Why This Matters</h2>
          <p className="text-slate-600 leading-relaxed">
            Developers rely on READMEs as the primary entry point to any codebase. If an LLM hallucinates an API method or misses a critical environment variable setup step, it leads to wasted developer time, frustration, and ultimately, abandoned adoption of the tool. 
            Evaluating model performance in this domain tests the model's ability to synthesize technical information accurately and ground its output strictly in the provided context window.
          </p>
        </section>
      </div>
    </div>
  );
}
