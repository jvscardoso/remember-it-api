import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateTaskDto } from './dto/create-tasks.dto';
import { UpdateTaskDto } from './dto/update-tasks.dto';
import { JwtAuthGuard } from '../auth/jtw-auth.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: TaskStatus,
  ): Promise<Task[]> {
    return this.tasksService.findAll(req.user.id, status);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateTaskDto,
  ): Promise<{ id: string; title: string; description: string | null }> {
    return this.tasksService.create(req.user.id, body);
  }

  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(req.user.id, id, body);
  }

  @Delete(':id')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.delete(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.tasksService.findById(req.user.id, id);
  }
}
