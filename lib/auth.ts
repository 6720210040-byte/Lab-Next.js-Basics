// lib/auth.ts — Helper สำหรับการดึง session และตรวจสอบ Authentication / Authorization
import { cookies } from 'next/headers';
import { findUserById } from './users';

export async function getSessionUserId(request?: Request): Promise<string | null> {
  // 1. ใช้ cookies() จาก next/headers เป็นหลัก (รองรับ Next.js 16+)
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (session?.value) {
      const value = decodeURIComponent(session.value).trim();
      if (value && value !== '') return value;
    }
  } catch (err) {
    console.warn('[Auth] cookies() failed:', err);
  }

  // 2. Fallback: ตรวจสอบจาก cookie header ใน Request object โดยตรง
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
      if (match) {
        const value = decodeURIComponent(match[1]).trim();
        if (value && value !== '') return value;
      }
    }
  }

  return null;
}

export async function getAuthenticatedUser(request?: Request) {
  const sessionUserId = await getSessionUserId(request);
  if (!sessionUserId) return null;
  
  const user = await findUserById(sessionUserId);
  if (!user) {
    console.warn(`[Auth] Session cookie has userId="${sessionUserId}" but user not found in any store`);
  }
  return user;
}

