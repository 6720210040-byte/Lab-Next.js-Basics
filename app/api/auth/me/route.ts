// app/api/auth/me/route.ts
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ authenticated: false, user: null });
  }
  return Response.json({
    authenticated: true,
    user: { id: user.id, email: user.email },
  });
}
