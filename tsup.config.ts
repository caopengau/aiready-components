import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'components/button': 'src/components/button.tsx',
    'components/card': 'src/components/card.tsx',
    'components/input': 'src/components/input.tsx',
    'components/label': 'src/components/label.tsx',
    'components/badge': 'src/components/badge.tsx',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  target: 'es2020',
  splitting: false,
  treeshake: true,
});