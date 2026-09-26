# Lab Week 9: Database Integration & CRUD Operations (PostgreSQL + Prisma)

## สรุปภาพรวมการทำ Lab Week 9

ใน Lab นี้ได้เชื่อมต่อฐานข้อมูลจริงผ่าน **PostgreSQL + Prisma ORM** และปรับโครงสร้างแบบ 3 ชั้น (Layered Architecture) ให้ทำงานร่วมกับ Database เต็มรูปแบบ:

1. **L0 (Setup: PostgreSQL + Prisma)**: ติดตั้ง `@prisma/client` และ `prisma`, สร้าง `prisma/schema.prisma` พร้อมกำหนด `DATABASE_URL` ใน `.env.local` และสร้าง Prisma Client Singleton ใน `lib/prisma.ts`
2. **L1 (แทนที่ Model ด้วย Prisma: Create + Read)**: แปลงฟังก์ชันใน `lib/messages.ts` ให้เรียกใช้ `prisma.message.create`, `prisma.message.findMany({ orderBy: { createdAt: 'desc' } })` และ `prisma.message.findUnique` พร้อมปรับชั้น Service ให้เป็น `async/await`
3. **L2 (Update ด้วย Prisma + จัดการ P2025)**: ใช้ `prisma.message.update` และดักจับ Prisma Error Code `P2025` (Record not found) เพื่อส่งคืนสถานะ 404 ให้ Client อย่างถูกต้อง
4. **L3 (Delete ด้วย Prisma)**: ใช้ `prisma.message.delete` พร้อมดักจับกรณีข้อมูลไม่มีอยู่จริงใน Database
5. **L4 (Prisma Studio + Seed + Error Handling P2002)**:
   - เพิ่ม constraint `@unique` ที่ฟิลด์ `email` ของ `Message`
   - จัดการดักจับ Prisma Error Code `P2002` (Unique constraint violation) แล้วแปลงเป็น error "อีเมลนี้ถูกใช้แล้ว" (HTTP 400)
   - สร้างไฟล์ `prisma/seed.ts` สำหรับเติมข้อมูลเริ่มต้น (Seed Data)

---

## Workshop: ระบบจัดการงาน (Todos Database CRUD API)

### Task W.1 & W.2: Prisma Schema & CRUD Operations
โมเดล `Todo` ถูกออกแบบใน `prisma/schema.prisma` ดังนี้:
```prisma
model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?  @default("")
  completed   Boolean  @default(false)
  priority    String   @default("medium")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

* **Create (`POST /api/todos`)**: บันทึกข้อมูลลง PostgreSQL จริงผ่าน `prisma.todo.create()`
* **Read All (`GET /api/todos`)**: ดึงข้อมูลพร้อมรองรับ filtering (where `OR: title/description`, `completed`, `priority`) และเรียงลำดับ `orderBy: { createdAt: 'desc' }`
* **Read One (`GET /api/todos/[id]`)**: ค้นหาผ่าน `prisma.todo.findUnique({ where: { id } })`
* **Update (`PATCH /api/todos/[id]`)**: แก้ไขฟิลด์ที่ส่งมา พร้อมอัปเดต `updatedAt` อัตโนมัติ ดักจับ `P2025` เมื่อไม่พบ id
* **Delete (`DELETE /api/todos/[id]`)**: ลบแถวออกจากฐานข้อมูลจริงผ่าน `prisma.todo.delete()`

---

### Task W.5: Layer Mapping Table

| ชั้น (Layer) | ไฟล์ในโปรเจกต์ | หน้าที่ |
| :--- | :--- | :--- |
| **Controller** | `app/api/todos/route.ts`<br>`app/api/todos/[id]/route.ts` | รับ HTTP Request (GET, POST, PATCH, DELETE), สกัดค่า URL params/Query parameters/Request Body, เรียกใช้ Service แบบ `async/await` และตอบกลับด้วย JSON response โดยครอบด้วย `withErrorHandling` |
| **Service** | `lib/todoService.ts` | เป็น Business Logic Layer ทำหน้าที่ Validate ข้อมูล (เช่น ตรวจสอบว่า title ห้ามว่าง, priority ถูกต้องหรือไม่), กรองข้อมูล (search/filter), ดักจับ Prisma Error Code (`P2002`, `P2025`) เพื่อแปลงเป็น Application/Validation Error ที่เข้าใจง่าย |
| **Model (Prisma)** | `lib/todos.ts` | ทำหน้าที่เชื่อมต่อและสั่งการฐานข้อมูลโดยตรงผ่าน Prisma Client methods (`prisma.todo.create`, `prisma.todo.findMany`, `prisma.todo.findUnique`, `prisma.todo.update`, `prisma.todo.delete`) |
| **Database Schema** | `prisma/schema.prisma` | กำหนดโครงสร้างตาราง (Data Definition), กำหนดชนิดข้อมูล (String, Boolean, DateTime), Primary Key (`@id @default(cuid())`), ค่าตั้งต้น (`@default(...)`) และ Timestamp อัตโนมัติ (`@updatedAt`) |

---

### Task W.6: Reflection

#### 1. อธิบาย Resource ที่เลือกออกแบบ: มี Field อะไรบ้าง ทำไมถึงเลือกชนิดข้อมูลและ Constraint (@unique/@default) แบบนั้น?
> Resource ที่เลือกคือ **`Todo`** ประกอบด้วยฟิลด์ `id` (String ด้วย `cuid()` ปลอดภัยและเหมาะกับ distributed systems), `title` (String จำเป็นต้องมี), `description` (String ที่เป็น Optional และมี `@default("")`), `completed` (Boolean มี `@default(false)` เพื่องานที่สร้างใหม่เริ่มต้นที่ยังไม่เสร็จ), `priority` (String มี `@default("medium")`), `createdAt` (DateTime `@default(now())`) และ `updatedAt` (DateTime `@updatedAt` เพื่อบันทึกเวลาแก้ไขล่าสุดอัตโนมัติ) การกำหนด `@default` ช่วยลดภาระฝั่ง Client ไม่ต้องส่งค่าที่ไม่จำเป็นมาทุกครั้ง

#### 2. ระหว่างออกแบบเจอจุดที่ต้องตัดสินใจบ้างไหม (เช่น ควรใส่ @unique ตรงไหน, ควรจับ Error กรณีไหนบ้าง)? เลือกแบบไหนและทำไม?
> - **การจับ Error Code `P2025` (Record not found)**: เมื่อ Client พยายาม `PATCH` หรือ `DELETE` กับ ID ที่ไม่มีอยู่จริงใน Database ตัว Prisma จะโยน `PrismaClientKnownRequestError` รหัส `P2025` ออกมา จึงต้องดักจับใน Service Layer เพื่อส่งคืนค่า `null` หรือโยน `NotFoundError` ให้ Controller ส่ง HTTP 404 กลับไป แทนที่จะปล่อยให้ล้มเป็น 500 Internal Server Error
> - **การจับ Error Code `P2002` (Unique Constraint)**: สำหรับ Message Model มีการกำหนด `@unique` ที่ฟิลด์ `email` จึงต้องดัก `P2002` เพื่อแจ้งเตือนผู้ใช้ด้วยข้อความ "อีเมลนี้ถูกใช้แล้ว" พร้อม HTTP status 400

#### 3. เทียบกับตอนใช้ Array ใน Week 8 การมีฐานข้อมูลจริงช่วยอะไรบ้างที่ชัดเจนที่สุดตอนทำ Workshop นี้?
> 1. **Data Persistence**: ข้อมูลไม่สูญหายเมื่อ Restart Dev Server หรือเมื่อเซิร์ฟเวอร์เกิดข้อผิดพลาด ต่างจาก Week 8 ที่เก็บใน RAM ซึ่งจะหายไปทุกครั้งที่แก้โค้ดหรือรีสตาร์ท
> 2. **Data Integrity & Constraints**: Database และ Prisma ช่วยบังคับกฎเกณฑ์ของข้อมูล เช่น `@unique`, ชนิดข้อมูล, การอัปเดต timestamp อัตโนมัติ (`@updatedAt`) ทำให้ข้อมูลมีความถูกต้องสมบูรณ์
> 3. **Query Capability**: สามารถใช้ความสามารถของ Database Engine เช่น `orderBy`, `where`, `mode: 'insensitive'` ในการกรองและเรียงลำดับข้อมูลได้อย่างมีประสิทธิภาพสูง
