export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStr = `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
  const res = Response.json({ ok: true, message: 'ออกจากระบบสำเร็จ' });
  res.headers.set('Set-Cookie', cookieStr);
  return res;
}
