import { withErrorHandling } from '@/lib/withErrorHandling';
import { getSessionUserId } from '@/lib/auth';
import { getCommentById, editComment, deleteComment } from '@/lib/commentService';
import { commentSchema } from '@/lib/schemas';
import { ValidationError } from '@/lib/errors';
import { ZodError } from 'zod';

export const GET = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const comment = await getCommentById(id);
    return Response.json({ comment });
  }
);

export const PATCH = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const sessionUserId = await getSessionUserId(request);
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

    const text = (parsed.text ?? parsed.content ?? '').trim();
    const updated = await editComment(id, text, sessionUserId);
    return Response.json({
      ok: true,
      comment: {
        ...updated,
        content: updated.text,
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      },
    });
  }
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const sessionUserId = await getSessionUserId(request);
    await deleteComment(id, sessionUserId);
    return Response.json({ ok: true, message: 'ลบคอมเมนต์สำเร็จ' });
  }
);
