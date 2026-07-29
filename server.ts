import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { mockDataset } from './src/data.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const getDirname = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  return process.cwd();
};
const __dirname = getDirname();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'dataset.json');

// Ensure dataset.json exists
async function initDB() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // If it doesn't exist, start with the mock dataset
    await fs.writeFile(DATA_FILE, JSON.stringify(mockDataset, null, 2));
  }
}
initDB();

app.get('/api/evaluations', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read dataset' });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const newEval = req.body;
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const evaluations = JSON.parse(data);
    newEval.id = Date.now().toString(); // simple ID
    evaluations.unshift(newEval); // Prepend new evaluation so it appears on top
    await fs.writeFile(DATA_FILE, JSON.stringify(evaluations, null, 2));
    res.json(newEval);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
});

// Gemini generation helper
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

// Multi-provider fallback runner to prevent rate limit errors across Groq, OpenRouter, and Gemini
async function callLLMFallback(prompt: string, isJson: boolean = false): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
    for (const model of groqModels) {
      try {
        const bodyObj: any = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: isJson ? 0.2 : 0.5,
        };
        if (isJson) bodyObj.response_format = { type: 'json_object' };

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyObj),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content || '';
          if (content.trim()) return content;
        } else {
          console.warn(`Groq model '${model}' returned status ${groqRes.status}. Trying fallback...`);
        }
      } catch (err) {
        console.warn(`Error calling Groq model '${model}':`, err);
      }
    }
  }

  if (openrouterKey) {
    const openrouterModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'google/gemini-2.0-flash-lite-preview-02-05:free',
      'qwen/qwen-2.5-72b-instruct:free'
    ];
    for (const model of openrouterModels) {
      try {
        const bodyObj: any = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: isJson ? 0.2 : 0.5,
        };
        if (isJson) bodyObj.response_format = { type: 'json_object' };

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/ai-eval',
            'X-Title': 'AI Evaluation Tool'
          },
          body: JSON.stringify(bodyObj),
        });

        if (orRes.ok) {
          const orData = await orRes.json();
          const content = orData.choices?.[0]?.message?.content || '';
          if (content.trim()) return content;
        } else {
          console.warn(`OpenRouter model '${model}' returned status ${orRes.status}. Trying fallback...`);
        }
      } catch (err) {
        console.warn(`Error calling OpenRouter model '${model}':`, err);
      }
    }
  }

  if (geminiKey) {
    try {
      const aiClient = getAI();
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      if (response.text?.trim()) return response.text;
    } catch (err) {
      console.warn("Gemini API fallback error:", err);
    }
  }

  throw new Error("AI generation service is currently experiencing high demand. Please wait a few moments before retrying.");
}

app.post('/api/generate-readme', async (req, res) => {
  try {
    const { repoUrl } = req.body; 
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required.' });
    }

    let ownerRepo = repoUrl.replace('https://github.com/', '').trim();
    if (ownerRepo.endsWith('/')) {
        ownerRepo = ownerRepo.slice(0, -1);
    }

    let treeRes = await fetch(`https://api.github.com/repos/${ownerRepo}/git/trees/main?recursive=1`);
    if (!treeRes.ok) {
        treeRes = await fetch(`https://api.github.com/repos/${ownerRepo}/git/trees/master?recursive=1`);
        if (!treeRes.ok) {
             return res.status(400).json({ error: 'Could not fetch repo tree. Make sure the repo is public and the default branch is main or master.' });
        }
    }
    
    const treeData = await treeRes.json();
    if (!treeData.tree || !Array.isArray(treeData.tree)) {
        return res.status(400).json({ error: 'Could not parse repository structure from GitHub. The repository might be empty or restricted.' });
    }
    const files = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path);
    
    let repoComplexity = 'Small';
    if (files.length > 50) repoComplexity = 'Medium';
    if (files.length > 200) repoComplexity = 'Large';

    let packageJsonContent = '';
    const packageJsonPath = files.find((f: string) => f === 'package.json');
    if (packageJsonPath) {
        const pkgRes = await fetch(`https://raw.githubusercontent.com/${ownerRepo}/HEAD/${packageJsonPath}`);
        if (pkgRes.ok) {
            packageJsonContent = await pkgRes.text();
        }
    }
    
    const prompt = `You are a documentation generator. Generate a comprehensive README.md for the GitHub repository: ${ownerRepo}.

Here is the file tree of the repository:
${files.slice(0, 150).join('\n')}
${files.length > 150 ? '...and more files.' : ''}

${packageJsonContent ? `Here is the package.json content:\n${packageJsonContent}\n` : ''}

Based on this limited information (and your general knowledge of this public repository if you know it), generate a standard README.md file. 
Include at minimum: Title, Description, Installation, Usage, and Contributing sections. 
Do your best to infer the purpose and usage from the file names and package.json.
Output ONLY the raw markdown content for the README.`;

    const readmeText = await callLLMFallback(prompt, false);
    
    res.json({ 
        readme: readmeText, 
        repoComplexity,
        repoName: ownerRepo
    });

  } catch (error: any) {
    console.error('Error generating README:', error);
    res.status(500).json({ error: error.message || 'Failed to generate README' });
  }
});

// Auto-Audit (LLM-as-a-Judge) endpoint
app.post('/api/auto-audit', async (req, res) => {
  try {
    const { repoUrl, readme } = req.body;
    if (!repoUrl || !readme) {
      return res.status(400).json({ error: 'repoUrl and readme are required.' });
    }

    let ownerRepo = repoUrl.replace('https://github.com/', '').trim();
    if (ownerRepo.endsWith('/')) ownerRepo = ownerRepo.slice(0, -1);

    let treeRes = await fetch(`https://api.github.com/repos/${ownerRepo}/git/trees/main?recursive=1`);
    if (!treeRes.ok) {
      treeRes = await fetch(`https://api.github.com/repos/${ownerRepo}/git/trees/master?recursive=1`);
    }

    let files: string[] = [];
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (treeData.tree && Array.isArray(treeData.tree)) {
        files = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path);
      }
    }

    let packageJsonContent = '';
    const packageJsonPath = files.find((f: string) => f === 'package.json');
    if (packageJsonPath) {
      const pkgRes = await fetch(`https://raw.githubusercontent.com/${ownerRepo}/HEAD/${packageJsonPath}`);
      if (pkgRes.ok) packageJsonContent = await pkgRes.text();
    }

    const prompt = `You are a strict, critical technical documentation auditor and QA judge.
You are auditing an LLM-generated README.md for the repository "${ownerRepo}".

SOURCE CODE FILE TREE (Sample):
${files.slice(0, 100).join('\n')}

PACKAGE.JSON:
${packageJsonContent.slice(0, 1000)}

GENERATED README TO AUDIT:
${readme}

EVALUATION RUBRIC:
Score each criterion on a scale from 1 (Severe Failure/Hallucination) to 5 (Flawless):
1. accuracy: Does it accurately reflect source code files and languages?
2. completeness: Are Installation, Usage, API, and License sections complete?
3. hallucination: Does it invent fake CLI flags, invalid package commands (e.g. 'npm install deno'), or deprecated APIs? (1 = severe hallucinations, 5 = 0 hallucinations)
4. structure: Quality of markdown hierarchy and formatting.
5. scope: Is detail level appropriate for a ${files.length} file repository?

CRITICAL: Your "notes" field MUST be a unique, highly specific 1-2 sentence critique referencing "${ownerRepo}" and stating EXACTLY what failed or succeeded (e.g. missing sections, hallucinated commands, or good coverage).

Output ONLY a JSON object:
{
  "scores": {
    "accuracy": 4,
    "completeness": 3,
    "hallucination": 4,
    "structure": 5,
    "scope": 4
  },
  "notes": "Specific critique for ${ownerRepo} detailing exact errors or strengths."
}`;

    const responseText = await callLLMFallback(prompt, true);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON response from LLM Judge.");
    }
    const auditData = JSON.parse(jsonMatch[0]);
    res.json(auditData);

  } catch (error: any) {
    console.error('Error in auto-audit:', error);
    res.status(500).json({ error: error.message || 'Auto-audit failed' });
  }
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Important: Handle ES5 wildcard for Express v4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
