export interface EvaluationRecord {
  id: string;
  repoName: string;
  repoComplexity: 'Small' | 'Medium' | 'Large';
  scores: {
    accuracy: number;
    completeness: number;
    hallucination: number;
    structure: number;
    scope: number;
  };
  notes: string;
}

export type TabType = 'overview' | 'rubric' | 'dataset' | 'analysis' | 'evaluator';
