import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { CreateTaskDto } from './dto/create-tasks.dto';

const mockPrismaService = () => ({
  task: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
});

describe('TasksService', () => {
  let service: TasksService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return tasks filtered by userId and status', async () => {
      const mockTasks = [{ id: '1', title: 'Task 1' }];
      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll('user1', TaskStatus.PENDING);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', status: TaskStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return tasks filtered only by userId when no status provided', async () => {
      const mockTasks = [{ id: '2', title: 'Task 2' }];
      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll('user1');

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('create', () => {
    it('should create a task and return selected fields', async () => {
      const dto = {
        title: 'New Task',
        description: 'Task desc',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueDate: '2025-12-31',
      };
      const createdTask = {
        id: 'task1',
        title: dto.title,
        description: dto.description,
      };
      prisma.task.create.mockResolvedValue(createdTask);

      const result = await service.create('user1', dto);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: new Date(dto.dueDate),
          user: { connect: { id: 'user1' } },
        },
        select: {
          id: true,
          title: true,
          description: true,
        },
      });
      expect(result).toEqual(createdTask);
    });

    it('should default status and priority when not provided', async () => {
      const dto = {
        title: 'Task without status/priority',
      };
      const createdTask = {
        id: 'task2',
        title: dto.title,
      };
      prisma.task.create.mockResolvedValue(createdTask);

      const result = await service.create('user1', dto);

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            dueDate: undefined,
          }) as Partial<CreateTaskDto>,
        }),
      );
      expect(result).toEqual(createdTask);
    });
  });

  describe('update', () => {
    const existingTask = {
      id: 'task1',
      userId: 'user1',
      title: 'Old Title',
      description: 'Old desc',
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      dueDate: null,
    };

    it('should update a task if user is authorized', async () => {
      const dto = {
        title: 'Updated Title',
        description: 'Updated desc',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        dueDate: '2025-11-30',
      };
      const updatedTask = {
        ...existingTask,
        ...dto,
        dueDate: new Date(dto.dueDate),
      };

      prisma.task.findUnique.mockResolvedValue(existingTask);
      prisma.task.update.mockResolvedValue(updatedTask);

      const result = await service.update('user1', existingTask.id, dto);

      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: existingTask.id },
      });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: existingTask.id },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: new Date(dto.dueDate),
        },
      });
      expect(result).toEqual(updatedTask);
    });

    it('should throw ForbiddenException if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user1', 'task-nonexistent', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not owner', async () => {
      prisma.task.findUnique.mockResolvedValue({
        ...existingTask,
        userId: 'other-user',
      });

      await expect(
        service.update('user1', existingTask.id, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    const existingTask = {
      id: 'task1',
      userId: 'user1',
      title: 'Title',
    };

    it('should delete task if user is authorized', async () => {
      prisma.task.findUnique.mockResolvedValue(existingTask);
      prisma.task.delete.mockResolvedValue(existingTask);

      const result = await service.delete('user1', existingTask.id);

      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: existingTask.id },
      });
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: existingTask.id },
      });
      expect(result).toEqual(existingTask);
    });

    it('should throw ForbiddenException if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.delete('user1', 'task-nonexistent')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user not owner', async () => {
      prisma.task.findUnique.mockResolvedValue({
        ...existingTask,
        userId: 'other-user',
      });

      await expect(service.delete('user1', existingTask.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findById', () => {
    it('should return task if found', async () => {
      const task = {
        id: 'task1',
        userId: 'user1',
        title: 'Title',
        description: 'Desc',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.task.findFirst.mockResolvedValue(task);

      const result = await service.findById('user1', 'task1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'task1', userId: 'user1' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(task);
    });

    it('should throw error if task not found', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findById('user1', 'task1')).rejects.toThrow(
        'Task not found or access denied',
      );
    });
  });
});
