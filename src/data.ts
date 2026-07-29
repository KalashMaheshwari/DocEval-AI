import { EvaluationRecord } from './types';

export const mockDataset: EvaluationRecord[] = [
  {
    "id": "1",
    "repoName": "lukeed/clsx",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "2",
    "repoName": "sindresorhus/p-limit",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "3",
    "repoName": "octokit/request.js",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "4",
    "repoName": "sindresorhus/is",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "5",
    "repoName": "validatorjs/validator.js",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "6",
    "repoName": "sindresorhus/delay",
    "repoComplexity": "Small",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "7",
    "repoName": "expressjs/cors",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "8",
    "repoName": "pmndrs/zustand",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "9",
    "repoName": "colinhacks/zod",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "10",
    "repoName": "axios/axios",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "11",
    "repoName": "fastify/fastify",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "12",
    "repoName": "chartjs/Chart.js",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "13",
    "repoName": "socketio/socket.io",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "14",
    "repoName": "tanstack/query",
    "repoComplexity": "Medium",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (root)."
  },
  {
    "id": "15",
    "repoName": "facebook/react",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 4
    },
    "notes": "Under-scoped: README is brief for a high-complexity codebase."
  },
  {
    "id": "16",
    "repoName": "vercel/next.js",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (nextjs-project)."
  },
  {
    "id": "17",
    "repoName": "vitejs/vite",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (@vitejs/vite-monorepo)."
  },
  {
    "id": "18",
    "repoName": "prisma/prisma",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (@prisma-next/monorepo)."
  },
  {
    "id": "19",
    "repoName": "nestjs/nest",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "20",
    "repoName": "trpc/trpc",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (root)."
  },
  {
    "id": "21",
    "repoName": "storybookjs/storybook",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "22",
    "repoName": "strapi/strapi",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Accurate, well-structured README with complete setup and usage guidelines."
  },
  {
    "id": "23",
    "repoName": "denoland/deno",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 5,
      "hallucination": 5,
      "structure": 5,
      "scope": 4
    },
    "notes": "Documented basic CLI usage but omitted V8 engine configuration flags; Under-scoped: README is brief for a high-complexity codebase."
  },
  {
    "id": "24",
    "repoName": "facebook/react-native",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 4,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (@react-native/monorepo); Provides basic iOS/Android setup but misses CocoaPods dependency linking steps."
  },
  {
    "id": "25",
    "repoName": "mrdoob/three.js",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 4,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Includes basic WebGL scene boilerplate but lacks animation loop setup."
  },
  {
    "id": "26",
    "repoName": "babel/babel",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 4,
      "hallucination": 5,
      "structure": 5,
      "scope": 4
    },
    "notes": "Documents core compiler transform API but lacks .babelrc configuration examples; Under-scoped: README is brief for a high-complexity codebase."
  },
  {
    "id": "27",
    "repoName": "webpack/webpack",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 5,
      "completeness": 4,
      "hallucination": 5,
      "structure": 5,
      "scope": 4
    },
    "notes": "Covered basic bundle entry point but omitted loader/plugin configuration schema; Under-scoped: README is brief for a high-complexity codebase."
  },
  {
    "id": "28",
    "repoName": "electron/electron",
    "repoComplexity": "Large",
    "scores": {
      "accuracy": 4,
      "completeness": 4,
      "hallucination": 5,
      "structure": 5,
      "scope": 5
    },
    "notes": "Missed primary npm package name (@electron-ci/dev-root); Outlines main process lifecycle but misses renderer IPC messaging examples."
  }
];
