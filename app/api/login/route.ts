// app/api/login/route.ts
import bcrypt from 'bcrypt';
import { findUserByEmail } from '@/lib/users';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  const isValid = user && (await bcrypt.compare(password, user.password));
  if (!isValid) {
    return Response.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }
  const res = Response.json({ ok: true, user: { id: user.id, email: user.email } });
  res.headers.set('Set-Cookie', `session=${user.id}; Path=/; HttpOnly; SameSite=Lax`);
  return res;
}