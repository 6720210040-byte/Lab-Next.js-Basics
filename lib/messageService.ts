import { Prisma } from '@prisma/client';
import * as MessageModel from './messages';
import { NotFoundError, ValidationError } from './errors';

export async function createMessage(data: { name: string; email: string; message: string }) {
  if (!data.name || !data.email || !data.message) {
    throw new ValidationError('ข้อมูลไม่ครบ');
  }

  try {
    return await MessageModel.addMessage(data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ValidationError('อีเมลนี้ถูกใช้แล้ว');
    }
    throw err;
  }
}

export async function listMessages(search?: string) {
  const all = await MessageModel.getMessages();
  if (!search) return all;
  const q = search.toLowerCase();
  return all.filter(
    (m) => m.name.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
  );
}

export async function getMessageById(id: string) {
  const message = await MessageModel.getMessageById(id);
  if (!message) {
    throw new NotFoundError('ไม่พบข้อความนี้');
  }
  return message;
}

export async function editMessage(
  id: string,
  updates: Partial<{ name: string; email: string; message: string }>
) {
  if (updates.message !== undefined && updates.message.trim() === '') {
    throw new ValidationError('ข้อความห้ามเป็นค่าว่าง');
  }

  try {
    return await MessageModel.updateMessage(id, updates);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return null;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ValidationError('อีเมลนี้ถูกใช้แล้ว');
    }
    throw err;
  }
}

export async function removeMessage(id: string) {
  try {
    await MessageModel.deleteMessage(id);
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return false;
    }
    throw err;
  }
}
