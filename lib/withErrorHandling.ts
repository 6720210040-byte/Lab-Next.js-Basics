type Handler = (req: Request, ctx: any) => Promise<Response>;

export function withErrorHandling(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      console.error('API Error:', err);
      const status = err?.status ?? 500;
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      return Response.json(
        { error: status === 500 && !err?.status ? 'เกิดข้อผิดพลาดที่ไม่คาดคิด' : message },
        { status }
      );
    }
  };
}
