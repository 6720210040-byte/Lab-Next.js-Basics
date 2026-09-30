// app/api/logout/route.ts
export async function POST() {
  const res = Response.json({ ok: true, message: 'ออกจากระบบสำเร็จ' });
  res.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return res;
}
