import bcrypt from 'bcrypt';
import { withErrorHandling } from '@/lib/withErrorHandling';
import { getAuthenticatedUser } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/schemas';
import { updateUserPassword } from '@/lib/users';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { ZodError } from 'zod';

export const POST = withErrorHandling(async (request: Request) => {
  // 1. ตรวจสอบว่าผู้ใช้ Login แล้วจริงจาก session cookie (Authentication)
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new ForbiddenError('กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน');
  }

  // 2. Validate input ด้วย Zod
  const rawBody = await request.json();
  let parsed;
  try {
    parsed = changePasswordSchema.parse(rawBody);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.issues[0].message);
    }
    throw err;
  }

  const { oldPassword, newPassword } = parsed;

  // 3. ตรวจสอบ oldPassword ด้วย bcrypt.compare ป้องกันการสวมรอย
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ValidationError('รหัสผ่านเดิมไม่ถูกต้อง');
  }

  // 4. บันทึกรหัสผ่านใหม่ (hash ด้วย bcrypt cost factor 10 ภายใน updateUserPassword)
  await updateUserPassword(user.id, newPassword);

  return Response.json({ ok: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
});
