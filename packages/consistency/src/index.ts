export { analyzeConsistency } from './analyzer';
export { analyzeNaming, detectNamingConventions } from './analyzers/naming';
export { analyzePatterns } from './analyzers/patterns';
export type {
  ConsistencyOptions,
  ConsistencyReport,
  ConsistencyIssue,
  NamingIssue,
  PatternIssue,
  ArchitectureIssue,
} from './types';
