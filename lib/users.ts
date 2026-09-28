// lib/users.ts — จัดการ User ด้วย Prisma และมี In-memory Fallback กรณีฐานข้อมูลยังไม่พร้อม
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

export interface User {
  id: string;
  email: string;
  password: string;
}

const globalForUsers = globalThis as unknown as {
  fallbackUsers?: User[];
};

export const fallbackUsers: User[] =
  globalForUsers.fallbackUsers ?? [
    {
      id: 'user-admin-1',
      email: 'admin@tsu.ac.th',
      password: bcrypt.hashSync('1234', 10),
    },
  ];

if (process.env.NODE_ENV !== 'production') {
  globalForUsers.fallbackUsers = fallbackUsers;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return user;
  } catch {
    // Fallback เมื่อ DB ติดต่อไม่ได้
  }
  return fallbackUsers.find((u) => u.email === email) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return user;
  } catch {
    // Fallback เมื่อ DB ติดต่อไม่ได้
  }
  return fallbackUsers.find((u) => u.id === id) ?? null;
}

export async function createUser(email: string, plainPassword: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  try {
    return await prisma.user.create({ data: { email, password: hashedPassword } });
  } catch {
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      email,
      password: hashedPassword,
    };
    fallbackUsers.push(newUser);
    return newUser;
  }
}

export async function updateUserPassword(id: string, newPlainPassword: string): Promise<User | null> {
  const hashedPassword = await bcrypt.hash(newPlainPassword, 10);
  try {
    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  } catch {
    const user = fallbackUsers.find((u) => u.id === id);
    if (user) {
      user.password = hashedPassword;
      return user;
    }
    return null;
  }
}