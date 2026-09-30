import { withErrorHandling } from '@/lib/withErrorHandling';
import { getAuthenticatedUser } from '@/lib/auth';
import { createComment, listComments } from '@/lib/commentService';
import { commentSchema } from '@/lib/schemas';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: Request) => {
  const chatId = new URL(request.url).searchParams.get('chatId') || undefined;
  const user = await getAuthenticatedUser(request);
  const rawComments = await listComments(chatId);
  const comments = rawComments.map((c: any) => ({
    id: c.id,
    chatId: c.chatId,
    postId: c.postId,
    author: c.author,
    authorId: c.authorId,
    text: c.text ?? c.content ?? '',
    content: c.content ?? c.text ?? '',
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
  }));

  return new Response(
    JSON.stringify({
      comments,
      authenticated: Boolean(user),
      currentUserId: user?.id ?? null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new ForbiddenError('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
  }

  const rawBody = await request.json();
  let parsed;
  try {
    parsed = commentSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.issues[0].message);
    }
    throw err;
  }

  const textContent = (parsed.text ?? parsed.content ?? '').trim();

  const comment = await createComment({
    chatId: parsed.chatId ?? undefined,
    postId: parsed.postId ?? undefined,
    author: user.email,
    authorId: user.id,
    text: textContent,
  });

  return Response.json({
    comment: {
      ...comment,
      content: comment.text,
      createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : String(comment.createdAt),
    }
  }, { status: 201 });
});
