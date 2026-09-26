import { getMessageById, editMessage, removeMessage } from '@/lib/messageService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const message = getMessageById(id);
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
    const updated = editMessage(id, updates);
    return Response.json({ ok: true, item: updated });
  }
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    removeMessage(id);
    return Response.json({ ok: true }, { status: 200 });
  }
);
