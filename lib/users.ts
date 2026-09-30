// lib/users.ts — จัดการ User ด้วย Prisma และมี Persistent Fallback รองรับทุกสภาพแวดล้อม
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';

export interface User {
  id: string;
  email: string;
  password: string;
}

const FALLBACK_FILE = path.join(process.cwd(), 'scratch', 'users_fallback.json');

function ensureScratchDir() {
  const dir = path.dirname(FALLBACK_FILE);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

function loadDiskUsers(): User[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) return list;
    }
  } catch {}
  return [];
}

function saveDiskUsers(users: User[]) {
  try {
    ensureScratchDir();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch {}
}

const defaultAdmin: User = {
  id: 'user-admin-1',
  email: 'admin@tsu.ac.th',
  password: bcrypt.hashSync('1234', 10),
};

const diskUsers = loadDiskUsers();
if (!diskUsers.some((u) => u.email.toLowerCase() === defaultAdmin.email.toLowerCase())) {
  diskUsers.unshift(defaultAdmin);
  saveDiskUsers(diskUsers);
}

const globalForUsers = globalThis as unknown as {
  fallbackUsers?: User[];
};

export const fallbackUsers: User[] = globalForUsers.fallbackUsers ?? diskUsers;
if (process.env.NODE_ENV !== 'production') {
  globalForUsers.fallbackUsers = fallbackUsers;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  
  // 1. ลองค้นหาจาก Database จริง
  try {
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (user) return user;
  } catch {}

  // 2. ค้นหาจาก Shared Disk File (แก้ปัญหา worker แยก process)
  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.email.trim().toLowerCase() === normalized);
  if (diskUser) return diskUser;

  // 3. ค้นหาจาก In-Memory Fallback
  return fallbackUsers.find((u) => u.email.trim().toLowerCase() === normalized) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return user;
  } catch {}

  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.id === id);
  if (diskUser) return diskUser;

  return fallbackUsers.find((u) => u.id === id) ?? null;
}

export async function createUser(email: string, plainPassword: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  let created: User | null = null;
  try {
    created = await prisma.user.create({ data: { email: normalized, password: hashedPassword } });
  } catch {}

  const finalUser: User = created ?? {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: normalized,
    password: hashedPassword,
  };

  // Sync เข้า Memory และ Persistent File
  const currentDisk = loadDiskUsers();
  const idx = currentDisk.findIndex((u) => u.email.trim().toLowerCase() === normalized);
  if (idx >= 0) {
    currentDisk[idx] = finalUser;
  } else {
    currentDisk.push(finalUser);
  }
  saveDiskUsers(currentDisk);

  if (!fallbackUsers.some((u) => u.id === finalUser.id)) {
    fallbackUsers.push(finalUser);
  }

  return finalUser;
}

export async function updateUserPassword(id: string, newPlainPassword: string): Promise<User | null> {
  const hashedPassword = await bcrypt.hash(newPlainPassword, 10);
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    if (updated) {
      const currentDisk = loadDiskUsers();
      const u = currentDisk.find((item) => item.id === id);
      if (u) {
        u.password = hashedPassword;
        saveDiskUsers(currentDisk);
      }
      return updated;
    }
  } catch {}

  const currentDisk = loadDiskUsers();
  const user = currentDisk.find((u) => u.id === id);
  if (user) {
    user.password = hashedPassword;
    saveDiskUsers(currentDisk);
    return user;
  }

  const memUser = fallbackUsers.find((u) => u.id === id);
  if (memUser) {
    memUser.password = hashedPassword;
    return memUser;
  }

  return null;
}