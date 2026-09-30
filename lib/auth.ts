// lib/auth.ts — Helper สำหรับการดึง session และตรวจสอบ Authentication / Authorization
import { cookies } from 'next/headers';
import { findUserById } from './users';

export async function getSessionUserId(request?: Request): Promise<string | null> {
  // 1. ตรวจสอบจาก cookie header ใน Request object โดยตรง
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }

  // 2. Fallback: ลองอ่านจาก next/headers cookies()
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (session?.value) {
      return decodeURIComponent(session.value).trim();
    }
  } catch {}

  return null;
}

export async function getAuthenticatedUser(request?: Request) {
  const sessionUserId = await getSessionUserId(request);
  if (!sessionUserId) return null;
  return findUserById(sessionUserId);
}

