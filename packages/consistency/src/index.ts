export { analyzeConsistency } from './analyzer';
export { analyzeNamingAST } from './analyzers/naming-ast';
export { analyzeNaming, detectNamingConventions } from './analyzers/naming'; // Legacy regex version
export { analyzePatterns } from './analyzers/patterns';
export type {
  ConsistencyOptions,
  ConsistencyReport,
  ConsistencyIssue,
  NamingIssue,
  PatternIssue,
  ArchitectureIssue,
} from './types';
