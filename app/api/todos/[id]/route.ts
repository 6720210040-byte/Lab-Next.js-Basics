import { getTodoById, editTodo, removeTodo } from '@/lib/todoService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const todo = await getTodoById(id);
    return Response.json({ todo });
  }
);

export const PATCH = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const updates = await request.json();
    const updated = await editTodo(id, updates);
    if (!updated) {
      return Response.json({ error: 'ไม่พบรายการงานนี้' }, { status: 404 });
    }
    return Response.json({ ok: true, item: updated });
  }
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const deleted = await removeTodo(id);
    if (!deleted) {
      return Response.json({ error: 'ไม่พบรายการงานนี้' }, { status: 404 });
    }
    return Response.json({ ok: true, message: 'ลบรายการสำเร็จ' }, { status: 200 });
  }
);
