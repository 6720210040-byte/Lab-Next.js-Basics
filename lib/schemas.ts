// lib/schemas.ts
import { z } from 'zod';

export const messageSchema = z.object({
  name: z.string().min(2, 'ชื่อสั้นเกินไป').max(100),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  tag: z.string().optional().nullable(),
  message: z.string().min(5, 'ข้อความสั้นเกินไป').max(1000),
  authorId: z.string().optional().nullable(),
});

export const editMessageSchema = z.object({
  name: z.string().min(2, 'ชื่อสั้นเกินไป').max(100).optional(),
  email: z.string().email('อีเมลไม่ถูกต้อง').optional(),
  message: z.string().min(5, 'ข้อความสั้นเกินไป').max(1000).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านเดิม'),
  newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร'),
});

export const registerSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง (เช่น example@gmail.com)'),
  password: z.string().min(4, 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร').max(100),
});

export const commentSchema = z.object({
  postId: z.string().optional().nullable(),
  chatId: z.string().optional().nullable(),
  text: z.string().max(1000, 'คอมเมนต์ยาวเกินไป').optional(),
  content: z.string().max(1000, 'คอมเมนต์ยาวเกินไป').optional(),
}).refine((data) => Boolean((data.text && data.text.trim().length > 0) || (data.content && data.content.trim().length > 0)), {
  message: 'ข้อความคอมเมนต์ห้ามว่าง',
  path: ['content'],
});
