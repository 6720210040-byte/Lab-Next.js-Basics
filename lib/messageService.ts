// Message service module - force conflict practice
import { Prisma } from '@prisma/client';
import * as MessageModel from './messages';
import { ForbiddenError, NotFoundError, ValidationError } from './errors';
import { messageSchema, editMessageSchema } from './schemas';
import { ZodError } from 'zod';


export async function createMessage(raw: unknown) {
  let data;
  try {
    data = messageSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.issues[0].message);
    }
    throw err;
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
  updates: unknown,
  sessionUserId?: string | null
) {
  const message = await getMessageById(id);
  if (message.authorId && message.authorId !== sessionUserId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์แก้ไขข้อความนี้');
  }
  

  let validUpdates;
  try {
    validUpdates = editMessageSchema.parse(updates);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.issues[0].message);
    }
    throw err;
  }

  try {
    return await MessageModel.updateMessage(id, validUpdates);
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

export async function removeMessage(id: string, sessionUserId?: string | null) {
  const message = await getMessageById(id);
  if (message.authorId && message.authorId !== sessionUserId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์ลบข้อความนี้');
  }

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
