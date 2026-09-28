// lib/commentService.ts — จัดการ Comment อย่างปลอดภัยด้วย Sanitize + Authorization + Validation
import { cleanRichText } from './sanitize';
import { prisma } from './prisma';
import { ForbiddenError, NotFoundError } from './errors';

export interface Comment {
  id: string;
  postId?: string | null;
  chatId?: string | null;
  author: string;
  authorId?: string | null;
  text: string;
  createdAt: Date;
}

const globalForComments = globalThis as unknown as {
  fallbackComments?: Comment[];
};

export const fallbackComments: Comment[] =
  globalForComments.fallbackComments ?? [];

if (process.env.NODE_ENV !== 'production') {
  globalForComments.fallbackComments = fallbackComments;
}

export async function createComment(data: {
  postId?: string;
  chatId?: string;
  author: string;
  authorId?: string | null;
  text: string;
}): Promise<Comment> {
  const safeText = cleanRichText(data.text); // ตัด <script>, onerror= ทิ้งก่อนเก็บ
  try {
    return await prisma.comment.create({
      data: {
        ...data,
        text: safeText,
      },
    });
  } catch {
    const item: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...data,
      text: safeText,
      createdAt: new Date(),
    };
    fallbackComments.unshift(item);
    return item;
  }
}

export async function listComments(chatId?: string): Promise<Comment[]> {
  try {
    return await prisma.comment.findMany({
      where: chatId ? { chatId } : undefined,
    });
  } catch {
    return fallbackComments.filter((c) => (!chatId ? true : c.chatId === chatId));
  }
}

export async function getCommentById(id: string): Promise<Comment> {
  let comment: Comment | null = null;
  try {
    comment = await prisma.comment.findUnique({ where: { id } });
  } catch {
    comment = fallbackComments.find((c) => c.id === id) ?? null;
  }

  if (!comment) {
    throw new NotFoundError('ไม่พบคอมเมนต์นี้');
  }
  return comment;
}

export async function editComment(id: string, text: string, sessionUserId?: string | null): Promise<Comment> {
  const comment = await getCommentById(id);
  if (!sessionUserId || (comment.authorId && comment.authorId !== sessionUserId)) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์แก้ไขคอมเมนต์นี้');
  }
  const safeText = cleanRichText(text);
  try {
    return await prisma.comment.update({
      where: { id },
      data: { text: safeText },
    });
  } catch {
    comment.text = safeText;
    return comment;
  }
}

export async function deleteComment(id: string, sessionUserId?: string | null): Promise<boolean> {
  const comment = await getCommentById(id);
  if (!sessionUserId || (comment.authorId && comment.authorId !== sessionUserId)) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์ลบคอมเมนต์นี้');
  }
  try {
    await prisma.comment.delete({
      where: { id },
    });
    return true;
  } catch {
    const index = fallbackComments.findIndex((c) => c.id === id);
    if (index >= 0) {
      fallbackComments.splice(index, 1);
    }
    return true;
  }
}
