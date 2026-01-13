import { readFileContent } from '@aiready/core';
import type { NamingIssue } from '../types';

/**
 * Analyzes naming conventions and quality
 */
export async function analyzeNaming(files: string[]): Promise<NamingIssue[]> {
  const issues: NamingIssue[] = [];

  for (const file of files) {
    const content = await readFileContent(file);
    const fileIssues = analyzeFileNaming(file, content);
    issues.push(...fileIssues);
  }

  return issues;
}

function analyzeFileNaming(file: string, content: string): NamingIssue[] {
  const issues: NamingIssue[] = [];

  // Split into lines for line number tracking
  const lines = content.split('\n');

  // Check for naming patterns
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for single letter variables (except i, j, k in loops)
    const singleLetterMatches = line.matchAll(/\b(?:const|let|var)\s+([a-hm-z])\s*=/gi);
    for (const match of singleLetterMatches) {
      issues.push({
        file,
        line: lineNumber,
        type: 'poor-naming',
        identifier: match[1],
        severity: 'minor',
        suggestion: `Use descriptive variable name instead of single letter '${match[1]}'`
      });
    }

    // Check for overly abbreviated variables
    const abbreviationMatches = line.matchAll(/\b(?:const|let|var)\s+([a-z]{1,3})(?=[A-Z]|_|\s*=)/g);
    for (const match of abbreviationMatches) {
      const abbrev = match[1];
      // Skip common acceptable abbreviations
      if (!['id', 'url', 'api', 'db', 'fs', 'os', 'ui'].includes(abbrev.toLowerCase())) {
        issues.push({
          file,
          line: lineNumber,
          type: 'abbreviation',
          identifier: abbrev,
          severity: 'info',
          suggestion: `Consider using full word instead of abbreviation '${abbrev}'`
        });
      }
    }

    // Check for snake_case vs camelCase mixing in TypeScript/JavaScript
    if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const camelCaseVars = line.match(/\b(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)\s*=/);
      const snakeCaseVars = line.match(/\b(?:const|let|var)\s+([a-z][a-z0-9]*_[a-z0-9_]*)\s*=/);
      
      if (snakeCaseVars) {
        issues.push({
          file,
          line: lineNumber,
          type: 'convention-mix',
          identifier: snakeCaseVars[1],
          severity: 'minor',
          suggestion: `Use camelCase '${snakeCaseToCamelCase(snakeCaseVars[1])}' instead of snake_case in TypeScript/JavaScript`
        });
      }
    }

    // Check for unclear boolean names (should start with is/has/should/can)
    const booleanMatches = line.matchAll(/\b(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)\s*:\s*boolean/gi);
    for (const match of booleanMatches) {
      const name = match[1];
      if (!name.match(/^(is|has|should|can|will|did)/i)) {
        issues.push({
          file,
          line: lineNumber,
          type: 'unclear',
          identifier: name,
          severity: 'info',
          suggestion: `Boolean variable '${name}' should start with is/has/should/can for clarity`
        });
      }
    }

    // Check for function names that don't indicate action
    const functionMatches = line.matchAll(/function\s+([a-z][a-zA-Z0-9]*)/g);
    for (const match of functionMatches) {
      const name = match[1];
      // Functions should typically start with verbs
      if (!name.match(/^(get|set|is|has|can|should|create|update|delete|fetch|load|save|process|handle|validate|check|find|search|filter|map|reduce)/)) {
        issues.push({
          file,
          line: lineNumber,
          type: 'unclear',
          identifier: name,
          severity: 'info',
          suggestion: `Function '${name}' should start with an action verb (get, set, create, etc.)`
        });
      }
    }
  });

  return issues;
}

function snakeCaseToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Detects naming convention patterns across the codebase
 */
export function detectNamingConventions(files: string[], allIssues: NamingIssue[]): {
  dominantConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'mixed';
  conventionScore: number;
} {
  // Count conventions
  const camelCaseCount = allIssues.filter(i => i.type === 'convention-mix').length;
  const totalChecks = files.length * 10; // Rough estimate

  if (camelCaseCount / totalChecks > 0.3) {
    return { dominantConvention: 'mixed', conventionScore: 0.5 };
  }

  // For TypeScript/JavaScript, default to camelCase
  return { dominantConvention: 'camelCase', conventionScore: 0.9 };
}
