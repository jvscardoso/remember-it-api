import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jtw-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: '1234',
        name: 'Test User',
      };
      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('me', () => {
    it('should return user details', async () => {
      service.findById.mockResolvedValue(mockUser);

      const req = { user: { id: 'user-id' } } as AuthenticatedRequest;

      const result = await controller.me(req);

      expect(service.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateMe', () => {
    it('should update and return user', async () => {
      const updateDto = { name: 'Updated User', email: 'newemail@test.com' };
      service.update.mockResolvedValue({ ...mockUser, ...updateDto });

      const req = { user: { id: 'user-id' } } as AuthenticatedRequest;

      const result = await controller.updateMe(req, updateDto);

      expect(service.update).toHaveBeenCalledWith('user-id', updateDto);
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });
  });
});
