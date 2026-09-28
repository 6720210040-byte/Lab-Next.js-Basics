import { prisma } from './prisma';

export interface MessageItem {
  id: string;
  name: string;
  email: string;
  message: string;
  authorId?: string | null;
  createdAt: Date;
}

const fallbackMessages: MessageItem[] = [
  {
    id: 'mock-msg-1',
    name: 'System',
    email: 'system@example.com',
    message: 'Database is unavailable, using local fallback data.',
    authorId: 'user-admin-1',
    createdAt: new Date(),
  },
];

export async function addMessage(data: { name: string; email: string; message: string; authorId?: string | null }) {
  try {
    return await prisma.message.create({ data });
  } catch {
    const item: MessageItem = {
      id: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date(),
    };
    fallbackMessages.unshift(item);
    return item;
  }
}

export async function getMessages() {
  try {
    return await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [...fallbackMessages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

export async function getMessageById(id: string) {
  try {
    const item = await prisma.message.findUnique({
      where: { id },
    });
    if (item) return item;
  } catch {
    // DB offline fallback
  }
  return fallbackMessages.find((m) => m.id === id) ?? null;
}

export async function updateMessage(
  id: string,
  updates: { name?: string; email?: string; message?: string; authorId?: string | null }
) {
  try {
    return await prisma.message.update({
      where: { id },
      data: updates,
    });
  } catch {
    const item = fallbackMessages.find((m) => m.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    return item;
  }
}

export async function deleteMessage(id: string) {
  try {
    return await prisma.message.delete({
      where: { id },
    });
  } catch {
    const index = fallbackMessages.findIndex((m) => m.id === id);
    if (index === -1) return null;
    const [deleted] = fallbackMessages.splice(index, 1);
    return deleted;
  }
}