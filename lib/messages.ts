import { prisma } from './prisma';

export async function addMessage(data: { name: string; email: string; message: string }) {
  return prisma.message.create({ data });
}

export async function getMessages() {
  return prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMessageById(id: string) {
  return prisma.message.findUnique({
    where: { id },
  });
}

export async function updateMessage(id: string, updates: { name?: string; email?: string; message?: string }) {
  return prisma.message.update({
    where: { id },
    data: updates,
  });
}

export async function deleteMessage(id: string) {
  return prisma.message.delete({
    where: { id },
  });
}