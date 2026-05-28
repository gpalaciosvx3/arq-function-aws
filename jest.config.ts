import type { Config } from 'jest';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.steps.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/ping/{domain,application}/**/*.ts',
    '!src/**/**/*.{types,dto,constants,error,mapper,repository}.ts',
    '!src/**/**/*.module.ts',
    '!src/**/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
} satisfies Config;
