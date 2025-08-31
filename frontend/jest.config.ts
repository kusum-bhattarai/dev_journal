import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'], 
  moduleNameMapper: {
  '^~/(.+)': '<rootDir>/src/$1',
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageThreshold: { global: { branches: 0, functions: 0, lines: 0, statements: 0 } }, 
};

export default config;