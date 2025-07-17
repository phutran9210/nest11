module.exports = {
  // Use ts-jest preset
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // File extensions Jest will process
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Root directories for tests and source code
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Test match patterns
  testMatch: ['<rootDir>/src/**/*.(test|spec).ts', '<rootDir>/test/**/*.(test|spec).ts'],

  // Transform configuration
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.constant.ts',
    '!src/**/*.config.ts',
    '!src/**/index.ts',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^~core/(.*)$': '<rootDir>/src/core/$1',
    '^~modules/(.*)$': '<rootDir>/src/modules/$1',
    '^~shared/(.*)$': '<rootDir>/src/shared/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '^~core/(.*)$': '<rootDir>/src/core/$1',
        '^~modules/(.*)$': '<rootDir>/src/modules/$1',
        '^~shared/(.*)$': '<rootDir>/src/shared/$1',
      },
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '^~core/(.*)$': '<rootDir>/src/core/$1',
        '^~modules/(.*)$': '<rootDir>/src/modules/$1',
        '^~shared/(.*)$': '<rootDir>/src/shared/$1',
      },
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
  ],
}
