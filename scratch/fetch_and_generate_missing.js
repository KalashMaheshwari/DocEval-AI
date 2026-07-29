import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MISSING_REPOS = [
  { name: 'denoland/deno', complexity: 'Large' },
  { name: 'facebook/react-native', complexity: 'Large' },
  { name: 'mrdoob/three.js', complexity: 'Large' },
  { name: 'webpack/webpack', complexity: 'Large' },
  { name: 'babel/babel', complexity: 'Large' },
  { name: 'electron/electron', complexity: 'Large' },
];

async function callLLM(prompt) {
  // Try Groq
  if (GROQ_API_KEY) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
    for (const model of models) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices[0].message.content;
        } else {
          console.warn(`Groq (${model}) returned ${res.status}: ${await res.text()}`);
        }
      } catch (e) {
        console.warn(`Groq (${model}) failed:`, e.message);
      }
    }
  }

  // Try OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.warn("OpenRouter failed, trying fallback...", e.message);
    }
  }

  // Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.warn("Gemini failed...", e.message);
    }
  }

  throw new Error("All LLM providers failed or missing API keys.");
}

async function fetchTree(ownerRepo) {
  let defaultBranch = 'main';
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${ownerRepo}`);
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      if (repoData.default_branch) defaultBranch = repoData.default_branch;
    }
  } catch {}

  const branches = [defaultBranch, 'main', 'master', 'canary', 'dev'];
  for (const branch of branches) {
    try {
      const res = await fetch(`https://api.github.com/repos/${ownerRepo}/git/trees/${branch}?recursive=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.tree && Array.isArray(data.tree)) {
          return data.tree;
        }
      }
    } catch {}
  }
  return null;
}

async function fetchPackageJson(ownerRepo) {
  const branches = ['main', 'master', 'canary', 'dev'];
  for (const branch of branches) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${ownerRepo}/${branch}/package.json`);
      if (res.ok) {
        return await res.text();
      }
    } catch {}
  }
  return null;
}

async function main() {
  const rawPath = path.join(process.cwd(), 'scratch', 'generated_raw_readmes.json');
  const existingContent = await fs.readFile(rawPath, 'utf-8');
  const existingData = JSON.parse(existingContent);

  const existingNames = new Set(existingData.map(d => d.ownerRepo));

  for (const repo of MISSING_REPOS) {
    if (existingNames.has(repo.name)) {
      console.log(`Skipping ${repo.name}, already generated.`);
      continue;
    }

    console.log(`\nFetching GitHub data for ${repo.name}...`);
    const tree = await fetchTree(repo.name);
    const pkgJson = await fetchPackageJson(repo.name);

    if (!tree) {
      console.error(`Failed to fetch tree for ${repo.name}`);
      continue;
    }

    const filePaths = tree.map(item => item.path).slice(0, 30);
    const fileCount = tree.length;

    console.log(`Generating README via LLM for ${repo.name} (${fileCount} files)...`);

    const prompt = `You are a technical documentation generator.
Generate a comprehensive, professional, and well-structured README.md file for the GitHub repository: "${repo.name}".

Repository context:
- Total file count: ${fileCount}
- Key repository files:
${filePaths.join('\n')}

${pkgJson ? `\npackage.json content snippet:\n${pkgJson.slice(0, 1500)}` : ''}

Generate ONLY the README.md content using standard markdown (headings, code blocks, installation, usage, contributing, license). Do not include intro or conversational text.`;

    try {
      const readmeText = await callLLM(prompt);
      console.log(`Successfully generated README for ${repo.name} (${readmeText.length} chars)`);

      existingData.push({
        ownerRepo: repo.name,
        complexity: repo.complexity,
        fileCount,
        files: filePaths,
        packageJsonContent: pkgJson,
        readmeText
      });

      await fs.writeFile(rawPath, JSON.stringify(existingData, null, 2));
    } catch (err) {
      console.error(`Failed to generate README for ${repo.name}:`, err.message);
    }
  }

  console.log(`\nDone! Total repos in generated_raw_readmes.json: ${existingData.length}`);
}

main();
