import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      name: 'João',
      email: 'joao@example.com',
      password: '123456',
    };

    it('should throw BadRequestException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create user and return expected data', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const expectedResponse = {
        id: 'user-id',
        email: 'joao@example.com',
        createdAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(expectedResponse);

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'João',
          email: 'joao@example.com',
          password: 'hashed-password',
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should throw InternalServerErrorException on unknow error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockRejectedValue(new Error('Erro inesperado'));

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    describe('findById', () => {
      it('should return user data', async () => {
        const user = {
          id: 'user-id',
          email: 'joao@example.com',
          name: 'João',
          createdAt: new Date(),
        };

        prisma.user.findUnique.mockResolvedValue(user);

        const result = await service.findById('user-id');

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-id' },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            password: false,
          },
        });

        expect(result).toEqual(user);
      });

      it('should return null if user is not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const result = await service.findById('nao-existe');

        expect(result).toBeNull();
      });

      describe('findByEmail', () => {
        it('should return user when a valid email is provided', async () => {
          const user = {
            id: 'user-id',
            email: 'joao@example.com',
            name: 'João',
            password: 'hashedPassword',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prisma.user.findUnique.mockResolvedValue(user);

          const result = await service.findByEmail('joao@example.com');

          expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'joao@example.com' },
          });

          expect(result).toEqual(user);
        });

        it('should return null when user is not found', async () => {
          prisma.user.findUnique.mockResolvedValue(null);

          const result = await service.findByEmail('notfound@example.com');

          expect(result).toBeNull();
        });
      });
    });
  });
});
