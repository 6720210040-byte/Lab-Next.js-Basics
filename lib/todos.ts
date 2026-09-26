import { prisma } from './prisma';

export async function createTodo(data: {
  title: string;
  description?: string;
  priority?: string;
}) {
  return prisma.todo.create({
    data: {
      title: data.title,
      description: data.description ?? '',
      completed: false,
      priority: data.priority ?? 'medium',
    },
  });
}

export async function getTodos(filter?: {
  search?: string;
  completed?: boolean;
  priority?: string;
}) {
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

  return prisma.todo.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTodoById(id: string) {
  return prisma.todo.findUnique({
    where: { id },
  });
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
  return prisma.todo.update({
    where: { id },
    data: updates,
  });
}

export async function deleteTodo(id: string) {
  return prisma.todo.delete({
    where: { id },
  });
}
