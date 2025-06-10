import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.BCRYPT_SALT_ROUNDS = '10';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'test_db';
  process.env.LOG_LEVEL = 'error'; // Minimize logging during tests
  process.env.ENABLE_FILE_LOGGING = 'false';
});

// Global test teardown
afterAll(() => {
  // Clean up if needed
});

// Mock winston logger globally to prevent console spam in tests
jest.mock('winston', () => ({
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    http: jest.fn(),
    log: jest.fn(),
  })),
}));

// Mock nest-winston
jest.mock('nest-winston', () => ({
  WinstonModule: {
    forRootAsync: jest.fn(),
  },
}));
