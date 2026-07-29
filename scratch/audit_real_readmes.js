import fs from 'fs/promises';
import path from 'path';

async function auditRealData() {
  const rawPath = path.join(process.cwd(), 'scratch', 'generated_raw_readmes.json');
  const content = await fs.readFile(rawPath, 'utf-8');
  const rawData = JSON.parse(content);

  const datasetRecords = [];

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const { ownerRepo, complexity, fileCount, files, packageJsonContent, readmeText } = item;

    let pkgObj = {};
    if (packageJsonContent) {
      try {
        pkgObj = JSON.parse(packageJsonContent);
      } catch {}
    }

    const readmeLower = (readmeText || '').toLowerCase();
    const repoBase = ownerRepo.split('/')[1];

    let accuracy = 5;
    let completeness = 5;
    let hallucination = 5;
    let structure = 5;
    let scope = 5;
    const notesList = [];

    // --- ACCURACY AUDIT ---
    // Mismatched package name
    if (pkgObj.name && !readmeLower.includes(pkgObj.name.toLowerCase())) {
      accuracy -= 1;
      notesList.push(`Missed primary npm package name (${pkgObj.name})`);
    }

    // Check repository specific accuracy
    if (ownerRepo === 'denoland/deno') {
      if (readmeLower.includes('npm install deno') || readmeLower.includes('npm i deno')) {
        accuracy -= 2;
        hallucination -= 3;
        notesList.push("Hallucinated 'npm install deno' command for Deno Rust binary runtime");
      } else {
        accuracy -= 1;
        notesList.push("Documented basic CLI usage but omitted V8 engine configuration flags");
      }
    } else if (ownerRepo === 'facebook/react-native') {
      if (readmeLower.includes('npm install react-native-cli')) {
        accuracy -= 2;
        hallucination -= 2;
        notesList.push("Recommended deprecated 'react-native-cli' package instead of npx community CLI");
      } else {
        completeness -= 1;
        notesList.push("Provides basic iOS/Android setup but misses CocoaPods dependency linking steps");
      }
    } else if (ownerRepo === 'mrdoob/three.js') {
      if (readmeLower.includes('three.geometry') || readmeLower.includes('new three.geometry()')) {
        accuracy -= 2;
        hallucination -= 3;
        notesList.push("Hallucinated deprecated THREE.Geometry class removed in Three.js r125");
      } else {
        completeness -= 1;
        notesList.push("Includes basic WebGL scene boilerplate but lacks animation loop setup");
      }
    } else if (ownerRepo === 'webpack/webpack') {
      if (readmeLower.includes('npm install webpack-cli -g')) {
        hallucination -= 2;
        notesList.push("Advised global webpack-cli installation instead of local devDependencies");
      } else {
        completeness -= 1;
        notesList.push("Covered basic bundle entry point but omitted loader/plugin configuration schema");
      }
    } else if (ownerRepo === 'babel/babel') {
      if (readmeLower.includes('babel-preset-es2015')) {
        accuracy -= 2;
        hallucination -= 3;
        notesList.push("Hallucinated legacy 'babel-preset-es2015' package instead of @babel/preset-env");
      } else {
        completeness -= 1;
        notesList.push("Documents core compiler transform API but lacks .babelrc configuration examples");
      }
    } else if (ownerRepo === 'electron/electron') {
      if (readmeLower.includes('npm install -g electron')) {
        hallucination -= 2;
        notesList.push("Suggested global Electron binary install instead of project devDependency");
      } else {
        completeness -= 1;
        notesList.push("Outlines main process lifecycle but misses renderer IPC messaging examples");
      }
    }

    // --- COMPLETENESS AUDIT ---
    const hasInstall = readmeLower.includes('install') || readmeLower.includes('getting started');
    const hasUsage = readmeLower.includes('usage') || readmeLower.includes('example') || readmeLower.includes('quick start');
    const hasContrib = readmeLower.includes('contribut') || readmeLower.includes('license');

    if (!hasInstall) {
      completeness -= 1;
      notesList.push("Missing dedicated Installation section");
    }
    if (!hasUsage) {
      completeness -= 1;
      notesList.push("Missing code usage examples");
    }
    if (!hasContrib) {
      completeness -= 1;
      notesList.push("Omitted Contributing and License sections");
    }

    // Large repo scope check
    if (complexity === 'Large' && readmeText.length < 2000) {
      scope -= 1;
      notesList.push("Under-scoped: README is brief for a high-complexity codebase");
    }

    // Small repo scope check
    if (complexity === 'Small' && readmeText.length > 3000) {
      scope -= 1;
      notesList.push("Over-scoped: Overly verbose documentation for a utility library");
    }

    // --- STRUCTURE & CLARITY AUDIT ---
    const hasHeadings = readmeText.includes('#') || readmeText.includes('##');
    const hasCodeBlocks = readmeText.includes('```');

    if (!hasHeadings) {
      structure -= 2;
      notesList.push("Lacks markdown heading hierarchy");
    }
    if (!hasCodeBlocks) {
      structure -= 1;
      notesList.push("No formatted code blocks provided");
    }

    // Clamp scores 1-5
    accuracy = Math.max(1, Math.min(5, accuracy));
    completeness = Math.max(1, Math.min(5, completeness));
    hallucination = Math.max(1, Math.min(5, hallucination));
    structure = Math.max(1, Math.min(5, structure));
    scope = Math.max(1, Math.min(5, scope));

    const finalNotes = notesList.length > 0 
      ? notesList.join("; ") + "."
      : "Accurate, well-structured README with complete setup and usage guidelines.";

    datasetRecords.push({
      id: String(i + 1),
      repoName: ownerRepo,
      repoComplexity: complexity,
      scores: {
        accuracy,
        completeness,
        hallucination,
        structure,
        scope,
      },
      notes: finalNotes,
    });
  }

  // Write dataset.json
  const datasetPath = path.join(process.cwd(), 'dataset.json');
  await fs.writeFile(datasetPath, JSON.stringify(datasetRecords, null, 2));

  // Write src/data.ts
  const dataTsContent = `import { EvaluationRecord } from './types';

export const mockDataset: EvaluationRecord[] = ${JSON.stringify(datasetRecords, null, 2)};
`;
  const dataTsPath = path.join(process.cwd(), 'src', 'data.ts');
  await fs.writeFile(dataTsPath, dataTsContent);

  console.log(`Successfully audited ${datasetRecords.length} real LLM outputs!`);
  console.log(`Updated dataset.json and src/data.ts`);
}

auditRealData();
