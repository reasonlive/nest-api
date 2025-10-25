import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    articles: [],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'Password123',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword123',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toBeInstanceOf(AuthResponseDto);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hash error', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      await expect(service.register(registerDto)).rejects.toThrow('Hash error');

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should successfully login with valid credentials', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword123',
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: ['id', 'email', 'password', 'firstName', 'lastName'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashedPassword123');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toBeInstanceOf(AuthResponseDto);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: ['id', 'email', 'password', 'firstName', 'lastName'],
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword123',
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashedPassword123');
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare error', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword123',
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Compare error'));

      await expect(service.login(loginDto)).rejects.toThrow('Compare error');

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });

  describe('validateUserById', () => {
    it('should return user without password when user exists', async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      };

      mockUserRepository.findOne.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUserById(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'email', 'firstName', 'lastName'],
      });
      expect(result).toEqual(userWithoutPassword);
    });

    it('should return null when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUserById(999);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        select: ['id', 'email', 'firstName', 'lastName'],
      });
      expect(result).toBeNull();
    });
  });

  describe('generateAuthResponse', () => {
    it('should generate correct auth response', () => {
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = service['generateAuthResponse'](mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toBeInstanceOf(AuthResponseDto);
      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it('should not include password in user data', () => {
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = service['generateAuthResponse'](mockUser);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('createdAt');
      expect(result.user).not.toHaveProperty('updatedAt');
      expect(result.user).not.toHaveProperty('articles');
    });
  });

  describe('edge cases', () => {
    it('should handle database error during registration', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow('Database error');
    });

    it('should handle database error during login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.login(loginDto)).rejects.toThrow('Database error');
    });

    it('should handle JWT service error', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(service.register(registerDto)).rejects.toThrow('JWT error');
    });
  });
});