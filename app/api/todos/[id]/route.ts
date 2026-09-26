import { getTodoById, editTodo, removeTodo } from '@/lib/todoService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const todo = getTodoById(id);
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
    const updated = editTodo(id, updates);
    return Response.json({ ok: true, item: updated });
  }
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    removeTodo(id);
    return Response.json({ ok: true, message: 'ลบรายการสำเร็จ' }, { status: 200 });
  }
);
