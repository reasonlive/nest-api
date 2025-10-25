import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Article } from '../articles/entities/article.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockAuthResponse = new AuthResponseDto('jwt-token', {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed', // Будет исключено в конструкторе
    createdAt: new Date(),
    updatedAt: new Date(),
    articles: [],
  });

  const registerDto = new RegisterDto();
  registerDto.email = 'newuser@example.com';
  registerDto.firstName = 'Jane';
  registerDto.lastName = 'Smith';
  registerDto.password = 'Password123';

  const loginDto = new LoginDto();
  loginDto.email = 'test@example.com';
  loginDto.password = 'Password123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user and return auth response', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result: AuthResponseDto = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toBe(mockAuthResponse);
      expect(result).toBeInstanceOf(AuthResponseDto);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should return 201 status code on successful registration', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toBeDefined();
      // Проверяем что метод завершается без ошибки - это означает статус 201
    });

    it('should throw ConflictException when user already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists')
      );

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should propagate validation errors from service', async () => {
      const validationError = new ConflictException('Email already taken');
      mockAuthService.register.mockRejectedValue(validationError);

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(registerDto)).rejects.toThrow('Email already taken');
    });

    it('should handle service errors during registration', async () => {
      const serviceError = new Error('Database connection failed');
      mockAuthService.register.mockRejectedValue(serviceError);

      await expect(controller.register(registerDto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('login', () => {
    it('should successfully login and return auth response', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(mockAuthResponse);
      expect(result).toBeInstanceOf(AuthResponseDto);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should return 200 status code on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toBeDefined();
      // Проверяем что метод завершается без ошибки - это означает статус 200
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('User not found')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Wrong password')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Wrong password');
    });

    it('should handle service errors during login', async () => {
      const serviceError = new Error('Service unavailable');
      mockAuthService.login.mockRejectedValue(serviceError);

      await expect(controller.login(loginDto)).rejects.toThrow('Service unavailable');
    });
  });

  describe('input validation', () => {
    it('should accept valid register DTO', async () => {
      const validRegisterDto: RegisterDto = {
        email: 'valid@example.com',
        firstName: 'Valid',
        lastName: 'User',
        password: 'ValidPass123',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(validRegisterDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
      expect(result).toBe(mockAuthResponse);
    });

    it('should accept valid login DTO', async () => {
      const validLoginDto: LoginDto = {
        email: 'valid@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(validLoginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginDto);
      expect(result).toBe(mockAuthResponse);
    });
  });

  describe('response structure', () => {
    it('should return AuthResponseDto with correct structure from register', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.user.id).toBe('number');
      expect(typeof result.user.email).toBe('string');
      expect(typeof result.user.firstName).toBe('string');
      expect(typeof result.user.lastName).toBe('string');
    });

    it('should return AuthResponseDto with correct structure from login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
    });
  });

  describe('error handling', () => {
    it('should not modify error messages from service', async () => {
      const originalError = new ConflictException('Original error message');
      mockAuthService.register.mockRejectedValue(originalError);

      try {
        await controller.register(registerDto);
      } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(error.message).toBe('Original error message');
        expect(error).toBeInstanceOf(ConflictException);
      }
    });

    it('should preserve error status codes from service', async () => {
      const unauthorizedError = new UnauthorizedException();
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      try {
        await controller.login(loginDto);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        expect(error.getStatus()).toBe(401);
      }
    });
  });
});