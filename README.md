# DocEval AI | LLM Documentation Evaluation Framework

DocEval AI is a benchmark platform for auditing LLM-generated technical documentation (`README.md`). It evaluates repository documentation across a 5-metric rubric (**Accuracy**, **Completeness**, **Hallucination Prevention**, **Structure & Clarity**, and **Appropriate Scope**), featuring automated LLM-as-a-Judge scoring, failure mode isolation, interactive analytics, and exportable benchmark datasets across public GitHub repositories.

---

## 🌟 Key Features

- **📊 Annotated Benchmark Dataset**: Includes human & AI-audited evaluations across 28 real public GitHub repositories, including 10 severe failure-case repositories (`denoland/deno`, `facebook/react-native`, `mrdoob/three.js`, `webpack/webpack`, etc.).
- **⚡ Automated QA Audit (LLM-as-a-Judge)**: Analyzes generated README documentation against source repository file trees and dependencies, scoring all 5 rubric metrics and generating repo-specific critique notes.
- **🔄 Multi-Provider Rate-Limit Fallback**: Automatic rotation runner across Groq (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`), OpenRouter (`deepseek-r1`, `gemini-2.0-flash-lite`, `qwen-2.5-72b`), and Gemini API (`gemini-2.0-flash`).
- **🔍 Full-Text Search & Category Filters**: Search repositories or evaluation notes in real-time, and filter by Failures ($\le 2$), Small, Medium, or Large complexity.
- **📥 Dataset Export**: Download the complete benchmark dataset as `.json` or `.csv` spreadsheets with one click.
- **👁️ Formatted Markdown Preview**: Toggle between Raw Markdown source code and a rendered rich preview with one-click clipboard copying.

---

## 📐 Evaluation Rubric (1–5 Scale)

| Metric | Description |
| :--- | :--- |
| **Accuracy** | Does the README accurately reflect the source code files, languages, and dependencies? |
| **Completeness** | Are Installation, Usage, API details, Contributing, and License sections complete? |
| **Hallucination** | Does it invent fake CLI flags, invalid npm install commands, or deprecated APIs? *(5 = 0 hallucinations)* |
| **Structure & Clarity** | Quality of markdown heading hierarchy, readability, and formatting. |
| **Appropriate Scope** | Is the documentation length and detail level proportionate to codebase size? |

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/KalashMaheshwari/DocEval-AI.git
   cd DocEval-AI
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your API keys (Groq, OpenRouter, or Gemini):
   ```env
   GROQ_API_KEY=your_groq_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🏗️ Project Architecture

```
DocEval-AI/
├── dataset.json            # Flat JSON database storing 28 annotated GitHub benchmark evaluations
├── server.ts               # Express backend & API routes (GitHub tree parser, LLM runner)
├── src/
│   ├── App.tsx             # Main layout & sidebar navigation
│   ├── components/
│   │   ├── Overview.tsx    # Domain brief & framework goals
│   │   ├── Rubric.tsx      # Interactive 5-metric rubric guide
│   │   ├── Dataset.tsx     # Filterable, searchable benchmark dataset table & export
│   │   ├── Analysis.tsx    # Statistical charts & complexity distribution
│   │   └── Evaluator.tsx   # Live README generator & Automated QA Audit tool
│   ├── data.ts             # Default fallback benchmark dataset
│   └── types.ts            # TypeScript definitions
└── vite.config.ts          # Vite frontend configuration
```

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for details.
