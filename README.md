# AIReady

> AI-readiness analysis tools for reducing tech debt and optimizing codebases for AI adoption

## 🎯 Mission

As AI becomes deeply integrated into SDLC, codebases accumulate tech debt faster due to:
- Knowledge cutoff limitations in AI models
- Different model preferences across team members
- Duplicated patterns AI doesn't recognize
- Context fragmentation that breaks AI understanding

AIReady helps teams **assess, visualize, and prepare** repositories for better AI adoption.

## 📦 Packages

### Core Tools (Free)

- **[@aiready/cli](https://www.npmjs.com/package/@aiready/cli)** [![npm](https://img.shields.io/npm/v/@aiready/cli)](https://www.npmjs.com/package/@aiready/cli) - Unified CLI interface for running all analysis tools together or individually
- **[@aiready/pattern-detect](https://www.npmjs.com/package/@aiready/pattern-detect)** [![npm](https://img.shields.io/npm/v/@aiready/pattern-detect)](https://www.npmjs.com/package/@aiready/pattern-detect) - Detect semantic duplicate patterns that waste AI context window tokens
- **[@aiready/context-analyzer](https://www.npmjs.com/package/@aiready/context-analyzer)** [![npm](https://img.shields.io/npm/v/@aiready/context-analyzer)](https://www.npmjs.com/package/@aiready/context-analyzer) - Analyze context window costs, import depth, cohesion, and fragmentation
- **[@aiready/consistency](https://www.npmjs.com/package/@aiready/consistency)** [![npm](https://img.shields.io/npm/v/@aiready/consistency)](https://www.npmjs.com/package/@aiready/consistency) - Check naming conventions and pattern consistency across your codebase

### Coming Soon

- **[@aiready/doc-drift](./packages/doc-drift)** - Track documentation freshness vs code churn to identify outdated docs
- **[@aiready/deps](./packages/deps)** - Analyze dependency health and detect circular dependencies

## 🚀 Quick Start

### Using Individual Tools

```bash
# Detect semantic duplicates
npx @aiready/pattern-detect ./src

# Analyze context costs
npx @aiready/context-analyzer ./src --output json

# Or install globally
npm install -g @aiready/pattern-detect @aiready/context-analyzer
```

> **💡 Smart Defaults:** All tools automatically:
> - Exclude test files, build outputs, and node_modules
> - Adjust sensitivity based on codebase size (~10 most serious issues)
> - Save reports to `.aiready/` directory
> 
> Use `--include-tests`, `--exclude`, or threshold options to customize behavior.

### Using Unified CLI

```bash
# Install CLI globally
npm install -g @aiready/cli

# Run unified analysis (patterns + context)
aiready scan .

# Run individual tools
aiready patterns . --similarity 0.6
aiready context . --max-depth 3

# Get JSON output (saved to .aiready/ by default)
aiready scan . --output json

# Specify custom output path
aiready scan . --output json --output-file custom-path.json
```

> **📁 Note:** All output files (JSON, HTML, Markdown) are saved to the `.aiready/` directory by default unless you specify a custom path with `--output-file`.

## ⚙️ Configuration

AIReady supports configuration files for persistent settings. Create one of these files in your project root:

- `aiready.json`
- `aiready.config.json` 
- `.aiready.json`
- `.aireadyrc.json`
- `aiready.config.js`
- `.aireadyrc.js`

### Example Configuration

```json
{
  "scan": {
    "include": ["**/*.{ts,tsx,js,jsx}"],
    "exclude": ["**/node_modules/**", "**/dist/**"]
  },
  "tools": {
    "pattern-detect": {
      "minSimilarity": 0.5,
      "minLines": 8,
      "severity": "high",
      "includeTests": false,
      "maxResults": 10
    },
    "context-analyzer": {
      "maxDepth": 5,
      "maxContextBudget": 100000,
      "minCohesion": 0.7,
      "maxResults": 10
    }
  },
  "output": {
    "format": "console",
    "file": null
  }
}
```

CLI options override config file settings.

**Default Exclusions:** By default, test files are excluded from all analyses (patterns: `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/test/**`, `**/tests/**`). Use `--include-tests` flag or `"includeTests": true` in config to include them.

**Note:** Console output is limited by default to prevent overwhelming displays. Use `--max-results` to control how many items are shown, or `--output json` for complete results.

## 🏗️ Development

We use a **Makefile-based workflow** for local development. See [MAKEFILE.md](./MAKEFILE.md) for full documentation.

### Quick Commands

```bash
# See all available commands
make help

# Install dependencies
make install

# Build all packages
make build

# Run tests
make test

# Fix code issues (lint + format)
make fix

# Run all quality checks
make check

# Pre-commit checks
make pre-commit
```

### Traditional pnpm Commands (still work)

```bash
pnpm install
pnpm build
pnpm test
pnpm dev
```

## 🚧 Project Status

AIReady is currently tool-only. The website and hosted SaaS are not live yet. The open-source CLI and packages provide:
- Pattern detection and context cost analysis
- Consistency checks (naming and patterns)
- Unified CLI with JSON/console outputs

Roadmap (planned, not yet available):
- Historical trend analysis and team benchmarking
- Custom rule engines and integration APIs
- Automated fix suggestions and CI/CD integration

## 📄 License

MIT - See LICENSE in individual packages
