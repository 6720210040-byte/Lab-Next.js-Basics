# Lab Week 8: Server-side Development Workshop & Reflection

## สรุปภาพรวมการทำ Lab Week 8

ใน Lab นี้ได้ดำเนินการตามขั้นตอนครบถ้วนตั้งแต่ **L0 ถึง L4** และ **Workshop**:
1. **L0 (Setup: Service Layer)**: แยกชั้น `Controller -> Service -> Model` โดยเพิ่ม `lib/messageService.ts` คั่นกลางระหว่าง `app/api/contact/route.ts` และ `lib/messages.ts`
2. **L1 (READ ครบ: GET all + GET one)**: สร้าง Dynamic Route `app/api/messages/[id]/route.ts` สำหรับดึงข้อความตาม id และเพิ่ม Query Parameter Filtering `?search=` ที่ `app/api/contact/route.ts`
3. **L2 (UPDATE: PATCH + Validation)**: เพิ่ม `updateMessage` ใน Model, `editMessage` พร้อมการตรวจสอบค่าว่างใน Service, และเมธอด `PATCH` ใน `app/api/messages/[id]/route.ts`
4. **L3 (DELETE + Discussion)**: เพิ่ม `deleteMessage`, `removeMessage`, เมธอด `DELETE` ใน `app/api/messages/[id]/route.ts` ที่คืนสถานะ 200 เมื่อลบสำเร็จ และ 404 เมื่อไม่พบข้อมูล
5. **L4 (Centralized Error Handling + Custom Errors)**: สร้าง Wrapper `lib/withErrorHandling.ts` และ Custom Error Classes (`NotFoundError`, `ValidationError`) ใน `lib/errors.ts` ทำให้ตอบ status code 400, 404, 500 อย่างถูกต้องโดยอัตโนมัติ

---

## Workshop: ระบบจัดการงาน (Todos CRUD API)

สำหรับ Workshop ได้เลือก Resource ใหม่ คือ **`Todo` (รายการสิ่งที่ต้องทำ / To-do list)** พร้อมรองรับฟีเจอร์ครบวงจร:

### Task W.1: CRUD ครบ 4 Operations
- **Create (`POST /api/todos`)**: สร้างรายการใหม่ พร้อมตรวจสอบความถูกต้องของข้อมูล
- **Read All (`GET /api/todos`)**: ดึงรายการทั้งหมด พร้อมรองรับ Query Search (`?search=`), สถานะ (`?completed=true|false`), ระดับความสำคัญ (`?priority=low|medium|high`)
- **Read One (`GET /api/todos/[id]`)**: ดึงข้อมูลรายการเฉพาะเจาะจงผ่าน Dynamic Route (ตอบ 404 หากไม่พบ)
- **Update (`PATCH /api/todos/[id]`)**: แก้ไขเฉพาะฟิลด์ที่ส่งมา (Partial update เช่น เปลี่ยนชื่อ, อัปเดตสถานะ completed หรือ priority)
- **Delete (`DELETE /api/todos/[id]`)**: ลบรายการออกจากระบบ (ตอบ 200 เมื่อลบสำเร็จ, ตอบ 404 เมื่อไม่พบ id)

---

### Task W.4: Layer Mapping Table

| ชั้น (Layer) | ไฟล์ในโปรเจกต์ | หน้าที่ |
| :--- | :--- | :--- |
| **Controller** | `app/api/todos/route.ts`<br>`app/api/todos/[id]/route.ts` | รับ HTTP Request (GET, POST, PATCH, DELETE), สกัดค่า URL params/Query parameters/Request Body, ส่งต่อให้ Service ประมวลผล และส่ง HTTP Response กลับไปยัง Client (ห่อด้วย `withErrorHandling`) |
| **Service** | `lib/todoService.ts` | เป็น Business Logic Layer ทำหน้าที่ Validate ข้อมูล (เช่น ตรวจสอบความถูกต้องของ title, priority, boolean types), กรองข้อมูล (search/filter), จัดการ Business Rule และโยน Custom Error (`ValidationError`, `NotFoundError`) |
| **Model** | `lib/todos.ts` | จัดการการเข้าถึงและเก็บข้อมูล (Data Storage & Operations) เช่น `addTodo`, `getTodos`, `findTodoById`, `updateTodo`, `deleteTodo` ซึ่งปัจจุบันเก็บใน Memory Array และพร้อมต่อยอดสู่ Database |

---

### Task W.5: Reflection

#### 1. อธิบาย Resource ที่เลือกออกแบบ: มีฟิลด์อะไรบ้าง และแต่ละ Operation (CRUD) ทำอะไร?
> Resource ที่เลือกคือ **`Todo`** ประกอบด้วยฟิลด์ `id` (UUID), `title` (ชื่อรายการ), `description` (รายละเอียด), `completed` (สถานะว่าเสร็จหรือยัง: boolean), `priority` ('low' | 'medium' | 'high'), `createdAt` (เวลาที่สร้าง) และ `updatedAt` (เวลาที่แก้ไขล่าสุด)
> - **C (Create)**: รับข้อมูล title, description, priority เพื่อสร้างรายการใหม่ โดยเริ่มต้น completed เป็น `false`
> - **R (Read)**: ให้บริการทั้งการอ่านรายการทั้งหมดพร้อม filter ตาม search/completed/priority และการอ่านรายการเจาะจง 1 รายการผ่าน dynamic route `[id]`
> - **U (Update)**: แก้ไขข้อมูลเฉพาะส่วน (เช่น สลับสถานะ completed หรือเปลี่ยน priority) โดย validate ค่าก่อนอัปเดตและบันทึกเวลา `updatedAt` ใหม่
> - **D (Delete)**: ลบรายการตาม id โดยตรวจสอบว่ามีรายการอยู่จริงก่อนลบ

#### 2. ระหว่างออกแบบเจอจุดที่ต้องตัดสินใจบ้างไหม (เช่น ใช้ PUT หรือ PATCH, ควรมี Service หรือไม่)? เลือกแบบไหนและทำไม?
> - **เลือกใช้ PATCH แทน PUT**: เนื่องจากการอัปเดตงาน To-do ส่วนใหญ่มักเป็นการแก้เฉพาะบางฟิลด์ เช่น การติ๊กถูกว่าเสร็จแล้ว (`completed: true`) หรือการเปลี่ยน priority เท่านั้น การใช้ `PATCH` ช่วยให้ Client ส่งเฉพาะฟิลด์ที่ต้องการเปลี่ยนได้ โดยไม่ต้องส่ง payload ทั้งก้อนมาใหม่ทั้งหมด
> - **การมี Service Layer คั่นกลาง**: มีความจำเป็นและมีประโยชน์อย่างมาก เพราะช่วยแยก validation logic และ business rules ออกจาก controller ทำให้ controller มีหน้าที่เพียงแค่รับ-ส่ง HTTP request/response ส่วน Service สามารถนำไป reuse ในที่อื่นๆ ได้ง่าย รวมถึงง่ายต่อการเขียน Unit Test

#### 3. ถ้า Model ของฟีเจอร์นี้ต้องเปลี่ยนจาก Array เป็นฐานข้อมูลจริงใน Week 9 คิดว่าต้องแก้ไฟล์ไหนบ้าง และไฟล์ไหนไม่ต้องแก้เลย?
> - **ไฟล์ที่ต้องแก้ไข**: แก้ไขเฉพาะไฟล์ในชั้น Model คือ **`lib/todos.ts`** (และปรับฟังก์ชันใน Service ให้รองรับ `async/await` หากเชื่อมต่อ DB ผ่าน Prisma/PostgreSQL) เพื่อเปลี่ยนจากการ mutate JavaScript array ใน memory ไปเป็นการ execute query / Prisma client method เช่น `prisma.todo.findMany()`, `prisma.todo.create()`, `prisma.todo.update()` เป็นต้น
> - **ไฟล์ที่ไม่ต้องแก้ไข**: ชั้น Controller (`app/api/todos/route.ts` และ `app/api/todos/[id]/route.ts`) แทบไม่ต้องแก้ไขเลย เพราะ Controller คุยผ่าน interface ของ Service Layer เท่านั้น ซึ่งเป็นข้อดีสำคัญของการออกแบบสถาปัตยกรรมแบบแยกชั้น (Layered Architecture / Separation of Concerns)

---

### Task 3.2 Discussion: Hard Delete vs Soft Delete
> - **ข้อดีของ Soft Delete**: ข้อมูลไม่สูญหายถาวร สามารถกู้คืน (Restore) หรือดูประวัติย้อนหลัง (Audit Log) ได้ ป้องกันข้อผิดพลาดจากการเผลอกดลบโดยไม่ตั้งใจ
> - **ข้อเสียและความซับซ้อน**: เพิ่มความซับซ้อนในการ Query ข้อมูล เพราะทุกคำสั่ง GET/listMessages จะต้องเพิ่มเงื่อนไข `WHERE isDeleted = false` หรือ `.filter(m => !m.isDeleted)` เสมอ และหากมี Unique Constraint ใน Database จะต้องจัดการ logic เป็นพิเศษ
