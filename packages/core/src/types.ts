export interface AnalysisResult {
  fileName: string;
  issues: Issue[];
  metrics: Metrics;
}

export interface Issue {
  type: IssueType;
  severity: 'critical' | 'major' | 'minor' | 'info';
  message: string;
  location: Location;
  suggestion?: string;
}

export type IssueType =
  | 'duplicate-pattern'
  | 'context-fragmentation'
  | 'doc-drift'
  | 'naming-inconsistency'
    | 'naming-quality'
    | 'pattern-inconsistency'
    | 'architecture-inconsistency'
  | 'dead-code'
  | 'circular-dependency'
  | 'missing-types';

export interface Location {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface Metrics {
  tokenCost?: number;
  complexityScore?: number;
  consistencyScore?: number;
  docFreshnessScore?: number;
}

export interface ScanOptions {
  rootDir: string;
  include?: string[];
  exclude?: string[];
  maxDepth?: number;
}

export interface AIReadyConfig {
  // Global scan options
  scan?: {
    include?: string[];
    exclude?: string[];
  };

  // Tool-specific configurations
  tools?: {
    'pattern-detect'?: {
      minSimilarity?: number;
      minLines?: number;
      batchSize?: number;
      approx?: boolean;
      minSharedTokens?: number;
      maxCandidatesPerBlock?: number;
      streamResults?: boolean;
      maxResults?: number;
    };
    'context-analyzer'?: {
      maxDepth?: number;
      maxContextBudget?: number;
      minCohesion?: number;
      maxFragmentation?: number;
      focus?: 'fragmentation' | 'cohesion' | 'depth' | 'all';
      includeNodeModules?: boolean;
      maxResults?: number;
    };
  };

  // Output preferences
  output?: {
    format?: 'console' | 'json' | 'html';
    file?: string;
  };
}

export interface Report {
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    majorIssues: number;
  };
  results: AnalysisResult[];
  metrics: {
    overallScore: number;
    tokenCostTotal: number;
    avgConsistency: number;
  };
}
