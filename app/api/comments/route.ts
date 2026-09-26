import { cookies } from 'next/headers';
import { addComment, getComments } from '@/lib/comments';
import { findUserById } from '@/lib/users';

const MIN_CONTENT_LENGTH = 3;
const MAX_CONTENT_LENGTH = 1000;

async function getAuthenticatedUser() {
  const sessionId = (await cookies()).get('session')?.value;
  return sessionId ? findUserById(sessionId) : null;
}

export async function GET(request: Request) {
  const chatId = new URL(request.url).searchParams.get('chatId') || undefined;
  const user = await getAuthenticatedUser();

  return Response.json({
    comments: getComments(chatId),
    authenticated: Boolean(user),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: 'กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น' }, { status: 401 });
  }

  const body = await request.json();
  const chatId = typeof body.chatId === 'string' ? body.chatId.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!chatId) {
    return Response.json({ error: 'ไม่พบรหัสแชท' }, { status: 400 });
  }

  if (content.length < MIN_CONTENT_LENGTH) {
    return Response.json({ error: `คอมเมนต์ต้องมีอย่างน้อย ${MIN_CONTENT_LENGTH} ตัวอักษร` }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return Response.json({ error: `คอมเมนต์ต้องไม่เกิน ${MAX_CONTENT_LENGTH} ตัวอักษร` }, { status: 400 });
  }

  const comment = addComment({
    chatId,
    author: user.email,
    content,
  });

  return Response.json({ comment }, { status: 201 });
}
