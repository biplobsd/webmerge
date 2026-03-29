import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/background/background.ts',
    'src/app/main.ts',
    'src/popup/main.ts',
    'src/offscreen/offscreen.ts',
    'src/manifest.config.ts',
  ],
  project: ['src/**/*.{ts,svelte}'],
  paths: {
    'src/*': ['./src/*'],
  },
  ignoreDependencies: [
    'daisyui',
    '@types/chrome',
    '@types/uuid',
    'autoprefixer',
  ],
  ignoreExportsUsedInFile: true,
  svelte: {
    entry: ['src/**/*.svelte'],
  },
};

export default config;
