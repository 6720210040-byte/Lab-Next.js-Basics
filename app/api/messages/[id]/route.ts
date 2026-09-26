import { getMessageById, editMessage, removeMessage } from '@/lib/messageService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const message = await getMessageById(id);
    return Response.json({ message });
  }
);

export const PATCH = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const updates = await request.json();
    const updated = await editMessage(id, updates);
    if (!updated) {
      return Response.json({ error: 'ไม่พบข้อความนี้' }, { status: 404 });
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
    const deleted = await removeMessage(id);
    if (!deleted) {
      return Response.json({ error: 'ไม่พบข้อความนี้' }, { status: 404 });
    }
    return Response.json({ ok: true, message: 'ลบข้อความสำเร็จ' }, { status: 200 });
  }
);
