import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUserId = 'user-id-123';

  const mockTask: Task = {
    id: 'task-id-1',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.PENDING,
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockUserId,
  };

  const mockTasksArray: Task[] = [mockTask];

  const mockTasksService = {
    findAll: jest.fn().mockResolvedValue(mockTasksArray),
    create: jest.fn().mockResolvedValue({
      id: 'task-id-1',
      title: 'Test Task',
      description: 'Test description',
    }),
    update: jest.fn().mockResolvedValue(mockTask),
    delete: jest.fn().mockResolvedValue(mockTask),
    findById: jest.fn().mockResolvedValue(mockTask),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  const mockRequest = {
    user: { id: mockUserId },
  } as AuthenticatedRequest;

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = await controller.findAll(mockRequest, TaskStatus.PENDING);
      expect(service.findAll).toHaveBeenCalledWith(
        mockUserId,
        TaskStatus.PENDING,
      );
      expect(result).toEqual(mockTasksArray);
    });
  });

  describe('create', () => {
    it('should create and return a task partial', async () => {
      const dto = { title: 'Test Task', description: 'Test description' };
      const result = await controller.create(mockRequest, dto);
      expect(service.create).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual({
        id: 'task-id-1',
        title: 'Test Task',
        description: 'Test description',
      });
    });
  });

  describe('update', () => {
    it('should update and return the task', async () => {
      const dto = { title: 'Updated title' };
      const taskId = 'task-id-1';
      const result = await controller.update(mockRequest, taskId, dto);
      expect(service.update).toHaveBeenCalledWith(mockUserId, taskId, dto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('delete', () => {
    it('should delete and return the task', async () => {
      const taskId = 'task-id-1';
      const result = await controller.delete(mockRequest, taskId);
      expect(service.delete).toHaveBeenCalledWith(mockUserId, taskId);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findById', () => {
    it('should return the task by id', async () => {
      const taskId = 'task-id-1';
      const result = await controller.findById(mockRequest, taskId);
      expect(service.findById).toHaveBeenCalledWith(mockUserId, taskId);
      expect(result).toEqual(mockTask);
    });
  });
});
