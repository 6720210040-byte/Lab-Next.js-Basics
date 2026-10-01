import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  const envDbUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (envDbUrl) {
    process.env.DATABASE_URL = envDbUrl;
  }
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const fallbackUsers: Array<{
  id: string;
  email: string;
  password: string;
}> = [
  {
    id: 'user-admin-1',
    email: 'admin@tsu.ac.th',
    // bcrypt hash of '1234' with 10 rounds
    password: '$2b$10$32rA5eF2X46aDsmv6XkIbe1Gk32e6s1qHkU9uQ1n9F1v3a9Z7eU.q',
  },
];

const fallbackMessages: Array<{
  id: string;
  name: string;
  email: string;
  message: string;
  authorId?: string | null;
  createdAt: Date;
}> = [
  {
    id: 'mock-msg-1',
    name: 'System',
    email: 'system@example.com',
    message: 'Database is unavailable, using local fallback data.',
    authorId: 'user-admin-1',
    createdAt: new Date(),
  },
];

const fallbackComments: Array<{
  id: string;
  postId?: string | null;
  chatId?: string | null;
  author: string;
  authorId?: string | null;
  text: string;
  createdAt: Date;
}> = [];

const fallbackTodos: Array<{
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'mock-todo-1',
    title: 'Setup local app',
    description: 'The app is running with in-memory fallback data.',
    completed: false,
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createMemoryPrisma = () => ({
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email) return fallbackUsers.find((u) => u.email === where.email) ?? null;
      if (where.id) return fallbackUsers.find((u) => u.id === where.id) ?? null;
      return null;
    },
    findMany: async () => [...fallbackUsers],
    create: async ({ data }: { data: { email: string; password: string } }) => {
      const existing = fallbackUsers.find((u) => u.email === data.email);
      if (existing) throw new Error('Email already exists');
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        email: data.email,
        password: data.password,
      };
      fallbackUsers.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: Partial<{ email: string; password: string }> }) => {
      const index = fallbackUsers.findIndex((u) => (where.id ? u.id === where.id : u.email === where.email));
      if (index === -1) throw new Error('User not found');
      fallbackUsers[index] = { ...fallbackUsers[index], ...data };
      return fallbackUsers[index];
    },
    upsert: async ({ where, update, create }: { where: { email: string }; update: Partial<{ password: string }>; create: { email: string; password: string } }) => {
      const index = fallbackUsers.findIndex((u) => u.email === where.email);
      if (index >= 0) {
        fallbackUsers[index] = { ...fallbackUsers[index], ...update };
        return fallbackUsers[index];
      }
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...create,
      };
      fallbackUsers.push(newUser);
      return newUser;
    },
    deleteMany: async () => {
      fallbackUsers.length = 0;
      return { count: 0 };
    },
  },
  message: {
    create: async ({ data }: { data: { name: string; email: string; message: string; authorId?: string | null } }) => {
      const item = {
        id: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...data,
        createdAt: new Date(),
      };
      fallbackMessages.unshift(item);
      return item;
    },
    createMany: async ({ data }: { data: Array<{ name: string; email: string; message: string; authorId?: string | null }> }) => {
      const created = data.map((item) => ({
        id: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...item,
        createdAt: new Date(),
      }));
      fallbackMessages.unshift(...created);
      return { count: created.length };
    },
    deleteMany: async () => {
      fallbackMessages.length = 0;
      return { count: 0 };
    },
    findMany: async (args?: { orderBy?: { createdAt?: 'asc' | 'desc' } }) => {
      const copy = [...fallbackMessages];
      if (args?.orderBy?.createdAt === 'desc') {
        return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      }
      return copy;
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      fallbackMessages.find((message) => message.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Partial<{ name: string; email: string; message: string; authorId?: string | null }> }) => {
      const index = fallbackMessages.findIndex((message) => message.id === where.id);
      if (index === -1) throw new Error('Message not found');
      fallbackMessages[index] = { ...fallbackMessages[index], ...data };
      return fallbackMessages[index];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = fallbackMessages.findIndex((message) => message.id === where.id);
      if (index === -1) throw new Error('Message not found');
      const [deleted] = fallbackMessages.splice(index, 1);
      return deleted;
    },
  },
  comment: {
    create: async ({ data }: { data: { postId?: string | null; chatId?: string | null; author: string; authorId?: string | null; text: string } }) => {
      const item = {
        id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...data,
        createdAt: new Date(),
      };
      fallbackComments.unshift(item);
      return item;
    },
    findMany: async ({ where }: { where?: { postId?: string; chatId?: string } } = {}) => {
      return fallbackComments.filter((c) => {
        if (where?.postId && c.postId !== where.postId) return false;
        if (where?.chatId && c.chatId !== where.chatId) return false;
        return true;
      });
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      fallbackComments.find((comment) => comment.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Partial<{ text: string }> }) => {
      const index = fallbackComments.findIndex((c) => c.id === where.id);
      if (index === -1) throw new Error('Comment not found');
      fallbackComments[index] = { ...fallbackComments[index], ...data };
      return fallbackComments[index];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = fallbackComments.findIndex((c) => c.id === where.id);
      if (index === -1) throw new Error('Comment not found');
      const [deleted] = fallbackComments.splice(index, 1);
      return deleted;
    },
    deleteMany: async () => {
      fallbackComments.length = 0;
      return { count: 0 };
    },
  },
  todo: {
    create: async ({ data }: { data: { title: string; description?: string; completed?: boolean; priority?: string } }) => {
      const item = {
        id: `mock-todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: data.title,
        description: data.description ?? '',
        completed: data.completed ?? false,
        priority: data.priority ?? 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackTodos.unshift(item);
      return item;
    },
    createMany: async ({ data }: { data: Array<{ title: string; description?: string; completed?: boolean; priority?: string }> }) => {
      const created = data.map((item) => ({
        id: `mock-todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: item.title,
        description: item.description ?? '',
        completed: item.completed ?? false,
        priority: item.priority ?? 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      fallbackTodos.unshift(...created);
      return { count: created.length };
    },
    deleteMany: async () => {
      fallbackTodos.length = 0;
      return { count: 0 };
    },
    findMany: async () => [...fallbackTodos].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    findUnique: async ({ where }: { where: { id: string } }) =>
      fallbackTodos.find((todo) => todo.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Partial<{ title: string; description: string; completed: boolean; priority: string }> }) => {
      const index = fallbackTodos.findIndex((todo) => todo.id === where.id);
      if (index === -1) throw new Error('Todo not found');
      fallbackTodos[index] = {
        ...fallbackTodos[index],
        ...data,
        updatedAt: new Date(),
      };
      return fallbackTodos[index];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = fallbackTodos.findIndex((todo) => todo.id === where.id);
      if (index === -1) throw new Error('Todo not found');
      const [deleted] = fallbackTodos.splice(index, 1);
      return deleted;
    },
  },
  $queryRawUnsafe: async (query: string) => {
    return fallbackUsers;
  },
  $disconnect: async () => undefined,
});

let prismaInstance: PrismaClient | ReturnType<typeof createMemoryPrisma> | undefined;

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance as PrismaClient;
  }
} catch {
  console.warn('Prisma database unavailable. Using in-memory fallback data.');
  prismaInstance = createMemoryPrisma();
}

export const prisma = (prismaInstance ?? createMemoryPrisma()) as unknown as PrismaClient;
