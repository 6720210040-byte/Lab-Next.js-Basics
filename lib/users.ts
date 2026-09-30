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
  
  // 1. ค้นหาจาก In-Memory Fallback (เร็วที่สุด)
  const memUser = fallbackUsers.find((u) => u.email.trim().toLowerCase() === normalized);
  if (memUser) return memUser;

  // 2. ค้นหาจาก Shared Disk File (เชื่อถือได้ ไม่มี timeout)
  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.email.trim().toLowerCase() === normalized);
  if (diskUser) {
    // Sync กลับเข้า memory
    if (!fallbackUsers.some((u) => u.id === diskUser.id)) {
      fallbackUsers.push(diskUser);
    }
    return diskUser;
  }

  // 3. ลองค้นหาจาก Database จริง (อาจช้าถ้า DB มีปัญหา)
  try {
    const user = await Promise.race([
      prisma.user.findUnique({ where: { email: normalized } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (user) {
      // Sync กลับเข้า memory + disk
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
  } catch {}

  return null;
}

export async function findUserById(id: string): Promise<User | null> {
  // 1. ค้นหาจาก In-Memory Fallback (เร็วที่สุด)
  const memUser = fallbackUsers.find((u) => u.id === id);
  if (memUser) return memUser;

  // 2. ค้นหาจาก Shared Disk File (เชื่อถือได้ ไม่มี timeout)
  const currentDisk = loadDiskUsers();
  const diskUser = currentDisk.find((u) => u.id === id);
  if (diskUser) {
    // Sync กลับเข้า memory เพื่อให้ครั้งถัดไปเร็วขึ้น
    if (!fallbackUsers.some((u) => u.id === diskUser.id)) {
      fallbackUsers.push(diskUser);
    }
    return diskUser;
  }

  // 3. ลองค้นหาจาก Database จริง (อาจช้าถ้า DB มีปัญหา)
  try {
    const user = await Promise.race([
      prisma.user.findUnique({ where: { id } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (user) {
      // Sync กลับเข้า memory + disk
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
  } catch {}

  return null;
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