// lib/auth.ts — Helper สำหรับการดึง session และตรวจสอบ Authentication / Authorization
import { findUserById } from './users';

export function getSessionUserId(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getAuthenticatedUser(request: Request) {
  const sessionUserId = getSessionUserId(request);
  if (!sessionUserId) return null;
  return findUserById(sessionUserId);
}
