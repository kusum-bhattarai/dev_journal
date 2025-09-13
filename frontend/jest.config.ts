import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  moduleNameMapper: {
    '^~/(.+)': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    // Broader pattern to include all potential ESM dependencies
    '/node_modules/(?!(react-markdown|remark-gfm|micromark|mdast|unified|bail|vfile|trough|remark|micromark-util-.*|comma-separated-tokens|space-separated-tokens|property-information|hast-util-.*|hast-to-.*|mdast-util-.*|unist-util-.*|@types/mdast|@types/hast|@types/unist)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageThreshold: { global: { branches: 0, functions: 0, lines: 0, statements: 0 } },
};

export default config;