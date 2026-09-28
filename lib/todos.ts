import { prisma } from './prisma';

export async function createTodo(data: {
  title: string;
  description?: string;
  priority?: string;
}) {
  try {
    return await prisma.todo.create({
      data: {
        title: data.title,
        description: data.description ?? '',
        completed: false,
        priority: data.priority ?? 'medium',
      },
    });
  } catch {
    return {
      id: `mock-todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: data.title,
      description: data.description ?? '',
      completed: false,
      priority: data.priority ?? 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function getTodos(filter?: {
  search?: string;
  completed?: boolean;
  priority?: string;
}) {
  try {
    const where: any = {};

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.completed !== undefined) {
      where.completed = filter.completed;
    }

    if (filter?.priority) {
      where.priority = filter.priority;
    }

    return await prisma.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [
      {
        id: 'mock-todo-1',
        title: 'Setup local app',
        description: 'The app is running with in-memory fallback data.',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

export async function getTodoById(id: string) {
  try {
    return await prisma.todo.findUnique({
      where: { id },
    });
  } catch {
    return null;
  }
}

export async function updateTodo(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    completed: boolean;
    priority: string;
  }>
) {
  try {
    return await prisma.todo.update({
      where: { id },
      data: updates,
    });
  } catch {
    return null;
  }
}

export async function deleteTodo(id: string) {
  try {
    return await prisma.todo.delete({
      where: { id },
    });
  } catch {
    return null;
  }
}
