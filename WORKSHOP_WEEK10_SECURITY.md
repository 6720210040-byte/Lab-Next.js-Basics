# รายงานปฏิบัติการ Lab บทที่ 10: Web Application Security และ Secure Coding

## ข้อมูลการทำงาน
- **Branch:** `lab-week10-security`
- **Framework:** Next.js (App Router), Prisma ORM, PostgreSQL
- **Security Packages:** `bcrypt`, `zod`, `sanitize-html`

---

## สรุปการดำเนินงานตามแต่ละ Task

### 1. L0: Setup โครงสร้างฐานข้อมูลและ Custom Error Class
- **Schema Update (`prisma/schema.prisma`):**
  - เพิ่มฟิลด์ `password String` ให้กับ `User` model สำหรับเก็บ Bcrypt Hash
  - เพิ่มฟิลด์ `authorId String?` ให้กับ `Message` model และ `Comment` model สำหรับตรวจสอบสิทธิ์ความเป็นเจ้าของ (Authorization)
- **Custom Error Class (`lib/errors.ts`):**
  - เพิ่ม `ForbiddenError` (HTTP Status `403`) สำหรับเคสที่ผู้ใช้ไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูล

---

### 2. L1: Password Hashing ด้วย Bcrypt
- **User Repository (`lib/users.ts`):**
  - บันทึกรหัสผ่านด้วย `bcrypt.hash(plainPassword, 10)` (Salt Rounds = 10)
  - ไม่มีการเก็บรหัสผ่าน Plain Text ในระบบ
- **Seed User (`prisma/seed.ts`):**
  - Hash รหัสผ่านของ `admin@tsu.ac.th` ด้วย `bcrypt.hash('1234', 10)` ก่อนบันทึกลงฐานข้อมูล
- **Secure Login (`app/api/login/route.ts`):**
  - ตรวจสอบความถูกต้องของรหัสผ่านด้วย `bcrypt.compare(password, user.password)`
  - ตั้งค่า Session Cookie แบบความปลอดภัยสูง (`HttpOnly; SameSite=Strict`)

---

### 3. L2: SQL Injection Prevention
- ยืนยันการใช้งาน **Prisma Client Query Builder** ในทุกส่วนของแอปพลิเคชัน ซึ่งแปลงคำสั่งเป็น Parameterized Queries โดยอัตโนมัติ
- ปราศจากการใช้ `$queryRawUnsafe` หรือการต่อสตริงคำสั่ง SQL โดยตรง

---

### 4. L3: XSS Prevention & HTML Sanitization
- **Sanitizer (`lib/sanitize.ts`):**
  - สร้างฟังก์ชัน `cleanRichText` โดยใช้ `sanitize-html`
  - กำหนด Whitelist เฉพาะแท็กที่ปลอดภัย: `<b>`, `<i>`, `<a>` (อนุญาตเฉพาะ attribute `href`)
  - ตัด `<script>`, inline event handlers (`onerror`, `onclick`) ออกทั้งหมดก่อนบันทึกลงฐานข้อมูล
- **Comment Service (`lib/commentService.ts`):**
  - ทำการ Sanitize เนื้อหาคอมเมนต์ก่อนบันทึกลงฐานข้อมูลเสมอ

---

### 5. L4: Input Validation & Authorization Check
- **Zod Schema (`lib/schemas.ts`):**
  - สร้าง `messageSchema`, `editMessageSchema`, `changePasswordSchema`, `commentSchema`
  - กำหนดความยาวต่ำสุด-สูงสุด และรูปแบบข้อมูล (เช่น Email format)
- **Validation ใน Service (`lib/messageService.ts`):**
  - แปลง `ZodError` ให้เป็น `ValidationError` (HTTP Status `400`) ส่งกลับ response ที่ชัดเจน
- **Authorization Enforcement (`lib/messageService.ts` & `app/api/messages/[id]/route.ts`):**
  - ตรวจสอบ `message.authorId !== sessionUserId`
  - หากไม่ใช่เจ้าของข้อมูล จะส่งกลับ `ForbiddenError` (HTTP Status `403`) ทันที

---

### 6. Workshop: Secure Features
1. **Change Password Feature (`POST /api/change-password`):**
   - ตรวจสอบ Authentication ผ่าน session cookie
   - ตรวจสอบรหัสผ่านเดิมด้วย `bcrypt.compare`
   - Validate รหัสผ่านใหม่ด้วย Zod (ความยาว $\ge 8$ ตัวอักษร)
   - Hash รหัสผ่านใหม่ด้วย bcrypt (cost factor 10) ก่อนอัปเดตลงฐานข้อมูล
2. **Comment Ownership & Security (`app/api/comments/`):**
   - รองรับการสร้าง, แก้ไข และลบคอมเมนต์
   - ป้องกัน XSS ด้วย `sanitize-html`
   - ตรวจสอบ Authorization ในคำขอ `PATCH` และ `DELETE` โดยอนุญาตเฉพาะเจ้าของคอมเมนต์เท่านั้น
