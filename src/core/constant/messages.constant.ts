export const MESSAGES = {
  USER: {
    CREATE_SUCCESS: 'User created successfully',
    UPDATE_SUCCESS: 'User updated successfully',
    DELETE_SUCCESS: 'User deleted successfully',
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    LIST_SUCCESS: 'Users retrieved successfully',
    DETAIL_SUCCESS: 'User details retrieved successfully',
  },
  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Invalid email format',
    MIN_LENGTH: 'Minimum length is {0} characters',
    MAX_LENGTH: 'Maximum length is {0} characters',
    INVALID_FORMAT: 'Invalid format',
  },
  COMMON: {
    SUCCESS: 'Operation completed successfully',
    ERROR: 'An error occurred',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Bad request',
  },
} as const;
