// lib/users.ts — จัดการ User ด้วย Prisma และมี Persistent Fallback รองรับทุกสภาพแวดล้อม
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';

if (!process.env.DATABASE_URL) {
  const envDbUrl =
    process.env.DATABASE_POSTGRES_PRISMA_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (envDbUrl) {
    process.env.DATABASE_URL = envDbUrl;
  }
}

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
  
  // 1. ลองค้นหาจาก Database จริงเป็นอันดับแรก (เพื่อรองรับ Multi-instance Serverless บน Vercel)
  try {
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (user) {
      if (!fallbackUsers.some((u) => u.id === user.id)) {
        fallbackUsers.push(user);
      }
      const diskUsers = loadDiskUsers();
      if (!diskUsers.some((u) => u.id === user.id)) {
        diskUsers.push(user);
        saveDiskUsers(diskUsers);
      }
      return user;
    }
  } catch (err: any) {
    console.warn('[findUserByEmail] Prisma DB query failed:', err?.message || err);
  }

  // 2. ค้นหาจาก In-Memory Fallback
  const memUser = fallbackUsers.find((u) => u.email.trim().toLowerCase() === normalized);
  if (memUser) return memUser;

  // 3. ค้นหาจาก Shared Disk File
  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.email.trim().toLowerCase() === normalized);
  if (diskUser) {
    if (!fallbackUsers.some((u) => u.id === diskUser.id)) {
      fallbackUsers.push(diskUser);
    }
    return diskUser;
  }

  return null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!id) return null;

  // 1. ลองค้นหาจาก Database จริงเป็นอันดับแรก (เพื่อรองรับ Multi-instance Serverless บน Vercel)
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      if (!fallbackUsers.some((u) => u.id === user.id)) {
        fallbackUsers.push(user);
      }
      const diskUsers = loadDiskUsers();
      if (!diskUsers.some((u) => u.id === user.id)) {
        diskUsers.push(user);
        saveDiskUsers(diskUsers);
      }
      return user;
    }
  } catch (err: any) {
    console.warn('[findUserById] Prisma DB query failed:', err?.message || err);
  }

  // 2. ค้นหาจาก In-Memory Fallback
  const memUser = fallbackUsers.find((u) => u.id === id);
  if (memUser) return memUser;

  // 3. ค้นหาจาก Shared Disk File
  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.id === id);
  if (diskUser) {
    if (!fallbackUsers.some((u) => u.id === diskUser.id)) {
      fallbackUsers.push(diskUser);
    }
    return diskUser;
  }

  return null;
}

export async function createUser(email: string, plainPassword: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  let created: User | null = null;
  try {
    created = await prisma.user.create({ data: { email: normalized, password: hashedPassword } });
    console.log('✅ User successfully created in Prisma database:', created.email, created.id);
  } catch (err: any) {
    console.error('❌ Error creating user in Prisma database:', err?.message || err);
  }

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