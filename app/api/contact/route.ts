import { createMessage, listMessages } from '@/lib/messageService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? '';
  const all = listMessages();
  const filtered = search
    ? all.filter((m) => m.name.includes(search) || m.message.includes(search))
    : all;
  return Response.json({ messages: filtered });
});

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json();
  const saved = createMessage(body);
  return Response.json({ ok: true, item: saved }, { status: 201 });
});