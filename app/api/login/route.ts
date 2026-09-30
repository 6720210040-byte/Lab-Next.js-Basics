// app/api/login/route.ts
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { findUserByEmail } from '@/lib/users';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  const isValid = user && (await bcrypt.compare(password, user.password));
  if (!isValid) {
    return Response.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  // ใช้ cookies() ของ Next.js 16 เพื่อ set session cookie
  const cookieStore = await cookies();
  cookieStore.set('session', user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return Response.json({ ok: true, user: { id: user.id, email: user.email } });
}