import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Task, TaskStatus, TaskPriority } from '@prisma/client';
import { UpdateTaskDto } from './dto/update-tasks.dto';
import { CreateTaskDto } from './dto/create-tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, status?: TaskStatus): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    data: CreateTaskDto,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
  }> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status ?? TaskStatus.PENDING,
        priority: data.priority ?? TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        user: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateTaskDto): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async delete(userId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.task.delete({ where: { id } });
  }

  async findById(
    userId: string,
    taskId: string,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
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

    if (!task) throw new Error('Task not found or access denied');

    return task;
  }
}
