import { Prisma } from '@prisma/client';
import * as TodoModel from './todos';
import { NotFoundError, ValidationError } from './errors';

const VALID_PRIORITIES = ['low', 'medium', 'high'];

export async function createTodo(data: {
  title?: string;
  description?: string;
  priority?: string;
}) {
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new ValidationError('กรุณาระบุชื่อรายการ (title ห้ามเป็นค่าว่าง)');
  }

  const priority = data.priority ?? 'medium';
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError('priority ต้องเป็น low, medium หรือ high เท่านั้น');
  }

  try {
    return await TodoModel.createTodo({
      title: data.title.trim(),
      description: data.description?.trim() ?? '',
      priority,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ValidationError('มีรายการงานนี้อยู่ในระบบแล้ว');
    }
    throw err;
  }
}

export async function listTodos(filter?: {
  search?: string;
  completed?: boolean;
  priority?: string;
}) {
  return TodoModel.getTodos(filter);
}

export async function getTodoById(id: string) {
  const item = await TodoModel.getTodoById(id);
  if (!item) {
    throw new NotFoundError('ไม่พบรายการงานนี้');
  }
  return item;
}

export async function editTodo(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    completed: boolean;
    priority: string;
  }>
) {
  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || updates.title.trim() === '') {
      throw new ValidationError('ชื่อรายการห้ามเป็นค่าว่าง');
    }
  }

  if (updates.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(updates.priority)) {
      throw new ValidationError('priority ต้องเป็น low, medium หรือ high เท่านั้น');
    }
  }

  if (updates.completed !== undefined && typeof updates.completed !== 'boolean') {
    throw new ValidationError('completed ต้องเป็น true หรือ false');
  }

  try {
    return await TodoModel.updateTodo(id, updates);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return null;
    }
    throw err;
  }
}

export async function removeTodo(id: string) {
  try {
    await TodoModel.deleteTodo(id);
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return false;
    }
    throw err;
  }
}
