import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '~core/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    guard = new JwtAuthGuard(mockReflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for public routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the super.canActivate method
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate when isPublic is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should check both handler and class for metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();

      mockExecutionContext.getHandler.mockReturnValue(mockHandler);
      mockExecutionContext.getClass.mockReturnValue(mockClass);
      mockReflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockHandler,
        mockClass,
      ]);
    });
  });

  describe('constructor', () => {
    it('should create guard with reflector dependency', () => {
      const newGuard = new JwtAuthGuard(mockReflector);

      expect(newGuard).toBeInstanceOf(JwtAuthGuard);
      expect(newGuard['reflector']).toBe(mockReflector);
    });
  });
});
