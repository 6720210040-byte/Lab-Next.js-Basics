import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  // Clear existing records to allow clean re-seeding
  await prisma.message.deleteMany();
  await prisma.todo.deleteMany();

  const hashed = await bcrypt.hash('1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@tsu.ac.th' },
    update: { password: hashed },
    create: { email: 'admin@tsu.ac.th', password: hashed },
  });

  // Seed Messages (Lab 4.2 & 4.3)
  await prisma.message.createMany({
    data: [
      { name: 'Alice', email: 'a@tsu.ac.th', message: 'สวัสดีครับ สนใจสอบถามเรื่องคอร์สเรียน' },
      { name: 'Bob', email: 'b@tsu.ac.th', message: 'Hello, looking forward to Next.js with Prisma.' },
      { name: 'Somchai', email: 'somchai@tsu.ac.th', message: 'ส่งแบบฟอร์มติดต่อสอบถามครับ' },
    ],
  });

  // Seed Todos (Workshop W.4)
  await prisma.todo.createMany({
    data: [
      {
        title: 'ทำแลป Week 9 (Prisma & PostgreSQL)',
        description: 'ศึกษาเรื่อง Model, Migration, CRUD Operations และ Seed Data',
        completed: true,
        priority: 'high',
      },
      {
        title: 'ทดสอบ Prisma Studio',
        description: 'เปิด GUI ตรวจสอบข้อมูลในตาราง Message และ Todo',
        completed: false,
        priority: 'medium',
      },
      {
        title: 'เตรียมส่ง Pull Request และ Vercel Preview',
        description: 'อัดคลิปสาธิตสั้นๆ และเขียน Reflection แนบท้าย',
        completed: false,
        priority: 'high',
      },
    ],
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
