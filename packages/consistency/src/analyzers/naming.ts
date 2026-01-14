import { readFileContent } from '@aiready/core';
import type { NamingIssue } from '../types';

// Common short English words that are NOT abbreviations (full, valid words)
const COMMON_SHORT_WORDS = new Set([
  // Full English words (1-3 letters)
  'day', 'key', 'net', 'to', 'go', 'for', 'not', 'new', 'old', 'top', 'end',
  'run', 'try', 'use', 'get', 'set', 'add', 'put', 'map', 'log', 'row', 'col',
  'tab', 'box', 'div', 'nav', 'tag', 'any', 'all', 'one', 'two', 'out', 'off',
  'on', 'yes', 'no', 'now', 'max', 'min', 'sum', 'avg', 'ref', 'src', 'dst',
  'raw', 'def', 'sub', 'pub', 'pre', 'mid', 'alt', 'opt', 'tmp', 'ext', 'sep',
  // Additional full words commonly flagged
  'tax', 'cat', 'dog', 'car', 'bus', 'web', 'app', 'war', 'law', 'pay', 'buy',
  'win', 'cut', 'hit', 'hot', 'pop', 'job', 'age', 'act', 'let', 'lot', 'bad',
  'big', 'far', 'few', 'own', 'per', 'red', 'low', 'see', 'six', 'ten', 'way',
  'who', 'why', 'yet', 'via', 'due', 'fee', 'fun', 'gas', 'gay', 'god', 'gun',
  'guy', 'ice', 'ill', 'kid', 'mad', 'man', 'mix', 'mom', 'mrs', 'nor', 'odd',
  'oil', 'pan', 'pet', 'pit', 'pot', 'pow', 'pro', 'raw', 'rep', 'rid', 'sad',
  'sea', 'sit', 'sky', 'son', 'tea', 'tie', 'tip', 'van', 'war', 'win', 'won'
]);

// Comprehensive list of acceptable abbreviations and acronyms
const ACCEPTABLE_ABBREVIATIONS = new Set([
  // Standard identifiers
  'id', 'uid', 'gid', 'pid',
  // Loop counters and iterators
  'i', 'j', 'k', 'n', 'm',
  // Web/Network
  'url', 'uri', 'api', 'cdn', 'dns', 'ip', 'tcp', 'udp', 'http', 'ssl', 'tls',
  'utm', 'seo', 'rss', 'xhr', 'ajax', 'cors', 'ws', 'wss',
  // Data formats
  'json', 'xml', 'yaml', 'csv', 'html', 'css', 'svg', 'pdf',
  // File types & extensions
  'img', 'txt', 'doc', 'docx', 'xlsx', 'ppt', 'md', 'rst', 'jpg', 'png', 'gif',
  // Databases
  'db', 'sql', 'orm', 'dao', 'dto', 'ddb', 'rds', 'nosql',
  // File system
  'fs', 'dir', 'tmp', 'src', 'dst', 'bin', 'lib', 'pkg',
  // Operating system
  'os', 'env', 'arg', 'cli', 'cmd', 'exe', 'cwd', 'pwd',
  // UI/UX
  'ui', 'ux', 'gui', 'dom', 'ref',
  // Request/Response
  'req', 'res', 'ctx', 'err', 'msg', 'auth',
  // Mathematics/Computing
  'max', 'min', 'avg', 'sum', 'abs', 'cos', 'sin', 'tan', 'log', 'exp',
  'pow', 'sqrt', 'std', 'var', 'int', 'num', 'idx',
  // Time
  'now', 'utc', 'tz', 'ms', 'sec', 'hr', 'min', 'yr', 'mo',
  // Common patterns
  'app', 'cfg', 'config', 'init', 'len', 'val', 'str', 'obj', 'arr',
  'gen', 'def', 'raw', 'new', 'old', 'pre', 'post', 'sub', 'pub',
  // Programming/Framework specific
  'ts', 'js', 'jsx', 'tsx', 'py', 'rb', 'vue', 're', 'fn', 'fns', 'mod', 'opts', 'dev',
  // Cloud/Infrastructure
  's3', 'ec2', 'sqs', 'sns', 'vpc', 'ami', 'iam', 'acl', 'elb', 'alb', 'nlb', 'aws',
  // Metrics/Performance
  'fcp', 'lcp', 'cls', 'ttfb', 'tti', 'fid', 'fps', 'qps', 'rps', 'tps',
  // Testing & i18n
  'po', 'e2e', 'a11y', 'i18n', 'l10n',
  // Domain-specific abbreviations (context-aware)
  'sk', 'fy', 'faq', 'og', 'seo', 'cta', 'roi', 'kpi',
  // Boolean helpers (these are intentional short names)
  'is', 'has', 'can', 'did', 'was', 'are',
  // Date/Time context (when in date contexts)
  'd', 't', 'dt'
]);

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

  // Check if this is a test file (more lenient rules)
  const isTestFile = file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/);

  // Split into lines for line number tracking
  const lines = content.split('\n');

  // Check for naming patterns
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for single letter variables (except i, j, k, l in loops/common contexts)
    const singleLetterMatches = line.matchAll(/\b(?:const|let|var)\s+([a-hm-z])\s*=/gi);
    for (const match of singleLetterMatches) {
      const letter = match[1].toLowerCase();
      
      // Enhanced loop/iterator context detection
      const isInLoopContext = 
        line.includes('for') || 
        /\.(map|filter|forEach|reduce|find|some|every)\s*\(/.test(line) ||
        line.includes('=>') || // Arrow function
        /\w+\s*=>\s*/.test(line); // Callback pattern
      
      // Check for i18n/translation context
      const isI18nContext = 
        line.includes('useTranslation') ||
        line.includes('i18n.t') ||
        /\bt\s*\(['"]/.test(line); // t('key') pattern
      
      // Check for arrow function parameter (improved detection)
      const isArrowFunctionParam = 
        /\(\s*[a-z]\s*(?:,\s*[a-z]\s*)*\)\s*=>/.test(line) || // (s) => or (a, b) =>
        /[a-z]\s*=>/.test(line); // s =>
      
      if (!isInLoopContext && !isI18nContext && !isArrowFunctionParam && !['x', 'y', 'z', 'i', 'j', 'k', 'l', 'n', 'm'].includes(letter)) {
        // Skip in test files unless it's really unclear
        if (isTestFile && ['a', 'b', 'c', 'd', 'e', 'f', 's'].includes(letter)) {
          continue;
        }
        
        issues.push({
          file,
          line: lineNumber,
          type: 'poor-naming',
          identifier: match[1],
          severity: 'minor',
          suggestion: `Use descriptive variable name instead of single letter '${match[1]}'`
        });
      }
    }

    // Check for overly abbreviated variables
    const abbreviationMatches = line.matchAll(/\b(?:const|let|var)\s+([a-z]{1,3})(?=[A-Z]|_|\s*=)/g);
    for (const match of abbreviationMatches) {
      const abbrev = match[1].toLowerCase();
      
      // Skip if it's a common short English word (full word, not abbreviation)
      if (COMMON_SHORT_WORDS.has(abbrev)) {
        continue;
      }
      
      // Skip acceptable abbreviations
      if (ACCEPTABLE_ABBREVIATIONS.has(abbrev)) {
        continue;
      }
      
      // Check for arrow function parameter context
      const isArrowFunctionParam = 
        /\(\s*[a-z]\s*(?:,\s*[a-z]\s*)*\)\s*=>/.test(line) || // (s) => or (a, b) =>
        new RegExp(`\\b${abbrev}\\s*=>`).test(line); // s =>
      
      if (isArrowFunctionParam) {
        continue;
      }
      
      // For very short names (1-2 letters), check for date/time context
      if (abbrev.length <= 2) {
        const isDateTimeContext = /date|time|day|hour|minute|second|timestamp/i.test(line);
        if (isDateTimeContext && ['d', 't', 'dt'].includes(abbrev)) {
          continue;
        }
        
        // Check for user/auth context
        const isUserContext = /user|auth|account/i.test(line);
        if (isUserContext && abbrev === 'u') {
          continue;
        }
      }
      
      issues.push({
        file,
        line: lineNumber,
        type: 'abbreviation',
        identifier: match[1],
        severity: 'info',
        suggestion: `Consider using full word instead of abbreviation '${match[1]}'`
      });
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
      
      // Skip JavaScript/TypeScript keywords that shouldn't be function names
      const isKeyword = ['for', 'if', 'else', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally', 'with', 'yield', 'await'].includes(name);
      if (isKeyword) {
        continue;
      }
      
      // Skip common entry point names
      const isEntryPoint = ['main', 'init', 'setup', 'bootstrap'].includes(name);
      if (isEntryPoint) {
        continue;
      }
      
      // Functions should typically start with verbs, but allow:
      // 1. Factory/builder patterns (ends with Factory, Builder, etc.)
      // 2. Descriptive compound names that explain what they return
      // 3. Event handlers (onClick, onSubmit, etc.)
      // 4. Descriptive aggregate/collection patterns
      // 5. Very long descriptive names (>15 chars)
      // 6. Compound words with 3+ capitals
      
      const isFactoryPattern = name.match(/(Factory|Builder|Creator|Generator)$/);
      const isEventHandler = name.match(/^on[A-Z]/);
      const isDescriptiveLong = name.length > 15; // Reduced from 20 to 15
      
      // Check for descriptive patterns
      const isDescriptivePattern = name.match(/^(default|total|count|sum|avg|max|min|initial|current|previous|next)\w+/) ||
                                   name.match(/\w+(Count|Total|Sum|Average|List|Map|Set|Config|Settings|Options|Props)$/);
      
      // Count capital letters for compound detection
      const capitalCount = (name.match(/[A-Z]/g) || []).length;
      const isCompoundWord = capitalCount >= 3; // daysSinceLastCommit has 4 capitals
      
      const hasActionVerb = name.match(/^(get|set|is|has|can|should|create|update|delete|fetch|load|save|process|handle|validate|check|find|search|filter|map|reduce|make|do|run|start|stop|build|parse|format|render|calculate|compute|generate|transform|convert|normalize|sanitize|encode|decode|compress|extract|merge|split|join|sort|compare|test|verify|ensure|apply|execute|invoke|call|emit|dispatch|trigger|listen|subscribe|unsubscribe|add|remove|clear|reset|toggle|enable|disable|open|close|connect|disconnect|send|receive|read|write|import|export|register|unregister|mount|unmount)/);
      
      if (!hasActionVerb && !isFactoryPattern && !isEventHandler && !isDescriptiveLong && !isDescriptivePattern && !isCompoundWord) {
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
