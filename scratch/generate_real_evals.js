import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY is missing from .env.local");
  process.exit(1);
}

const REPOS = [
  // Small Repos
  { name: 'lukeed/clsx', complexity: 'Small' },
  { name: 'sindresorhus/p-limit', complexity: 'Small' },
  { name: 'colorette/colorette', complexity: 'Small' },
  { name: 'octokit/request.js', complexity: 'Small' },
  { name: 'sindresorhus/is', complexity: 'Small' },
  { name: 'validatorjs/validator.js', complexity: 'Small' },
  { name: 'sindresorhus/delay', complexity: 'Small' },

  // Medium Repos
  { name: 'expressjs/cors', complexity: 'Medium' },
  { name: 'pmndrs/zustand', complexity: 'Medium' },
  { name: 'colinhacks/zod', complexity: 'Medium' },
  { name: 'axios/axios', complexity: 'Medium' },
  { name: 'fastify/fastify', complexity: 'Medium' },
  { name: 'chartjs/Chart.js', complexity: 'Medium' },
  { name: 'socketio/socket.io', complexity: 'Medium' },
  { name: 'tanstack/query', complexity: 'Medium' },

  // Large Repos
  { name: 'facebook/react', complexity: 'Large' },
  { name: 'vercel/next.js', complexity: 'Large' },
  { name: 'vitejs/vite', complexity: 'Large' },
  { name: 'prisma/prisma', complexity: 'Large' },
  { name: 'nestjs/nest', complexity: 'Large' },
  { name: 'trpc/trpc', complexity: 'Large' },
  { name: 'storybookjs/storybook', complexity: 'Large' },
  { name: 'strapi/strapi', complexity: 'Large' },
];

async function fetchTree(ownerRepo) {
  const branches = ['main', 'master', 'canary', 'dev'];
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

async function callGroqWithRetry(prompt, ownerRepo) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    const errText = await res.text();
    if (res.status === 429) {
      console.log(`Rate limited on ${ownerRepo}. Waiting 15s before retry (attempt ${attempts})...`);
      await new Promise(r => setTimeout(r, 15000));
    } else {
      console.error(`Groq API Error for ${ownerRepo}:`, errText);
      return '';
    }
  }
  return '';
}

async function generateForRepo(repo) {
  const ownerRepo = repo.name;
  console.log(`\n========================================`);
  console.log(`Fetching repository data for: ${ownerRepo} (${repo.complexity})`);

  const tree = await fetchTree(ownerRepo);
  if (!tree) {
    console.error(`Could not fetch file tree for ${ownerRepo}`);
    return null;
  }

  const files = tree.filter((t) => t.type === 'blob').map((t) => t.path);

  let packageJsonContent = '';
  const packageJsonPath = files.find((f) => f === 'package.json');
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

  console.log(`Calling Groq API for ${ownerRepo}...`);
  const readmeText = await callGroqWithRetry(prompt, ownerRepo);

  if (!readmeText) {
    console.error(`Failed to generate README for ${ownerRepo}`);
    return null;
  }

  return {
    ownerRepo,
    complexity: repo.complexity,
    fileCount: files.length,
    files,
    packageJsonContent,
    readmeText,
  };
}

async function run() {
  const results = [];
  for (const repo of REPOS) {
    try {
      const res = await generateForRepo(repo);
      if (res) {
        results.push(res);
      }
      // Brief delay between calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.error(`Error processing ${repo.name}:`, e);
    }
  }

  await fs.mkdir('./scratch', { recursive: true });
  await fs.writeFile('./scratch/generated_raw_readmes.json', JSON.stringify(results, null, 2));
  console.log(`\nSuccessfully saved ALL ${results.length} generated READMEs to ./scratch/generated_raw_readmes.json`);
}

run();
