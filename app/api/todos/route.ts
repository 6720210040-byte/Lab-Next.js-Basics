import { createTodo, listTodos } from '@/lib/todoService';
import { Priority } from '@/lib/todos';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const GET = withErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const completedParam = url.searchParams.get('completed');
  const priorityParam = url.searchParams.get('priority') as Priority | null;

  const completed =
    completedParam !== null ? completedParam.toLowerCase() === 'true' : undefined;
  const priority = priorityParam ?? undefined;

  const todos = listTodos({ search, completed, priority });
  return Response.json({ todos });
});

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json();
  const created = createTodo(body);
  return Response.json({ ok: true, item: created }, { status: 201 });
});
