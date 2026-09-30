import { createMessage, listMessages } from '@/lib/messageService';
import { withErrorHandling } from '@/lib/withErrorHandling';
import { getSessionUserId } from '@/lib/auth';

export const GET = withErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const messages = await listMessages(search);
  return Response.json({ messages });
});

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json();
  const sessionUserId = await getSessionUserId(request);
  const saved = await createMessage({
    ...body,
    authorId: body.authorId ?? sessionUserId,
  });
  return Response.json({ ok: true, item: saved }, { status: 201 });
});