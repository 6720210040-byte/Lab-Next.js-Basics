// app/api/register/route.ts
import { findUserByEmail, createUser } from '@/lib/users';
import { registerSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/withErrorHandling';
import { ValidationError } from '@/lib/errors';
import { ZodError } from 'zod';

export const POST = withErrorHandling(async (request: Request) => {
  const rawBody = await request.json();
  let parsed;
  try {
    parsed = registerSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.issues[0].message);
    }
    throw err;
  }

  const normalizedEmail = parsed.email.trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ValidationError('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ');
  }

  const user = await createUser(normalizedEmail, parsed.password);

  const res = Response.json(
    { ok: true, message: 'สมัครสมาชิกสำเร็จ', user: { id: user.id, email: user.email } },
    { status: 201 }
  );
  // Auto-login session cookie
  res.headers.set('Set-Cookie', `session=${user.id}; Path=/; HttpOnly; SameSite=Lax`);
  return res;
});
