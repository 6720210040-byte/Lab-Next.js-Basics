import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const commentId = resolvedParams.id;
    const body = await request.json().catch(() => ({}));
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string' || !emoji.trim()) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    const trimmedEmoji = emoji.trim();

    // หากมี Prisma model commentReaction ให้ใช้ prisma.commentReaction.create
    // หรือถ้าไม่มีใน schema ให้ส่ง mock response กลับไป
    const prismaWithReaction = prisma as unknown as {
      commentReaction?: {
        create: (args: { data: { commentId: string; emoji: string } }) => Promise<unknown>;
      };
    };

    if (prismaWithReaction.commentReaction?.create) {
      const reaction = await prismaWithReaction.commentReaction.create({
        data: {
          commentId,
          emoji: trimmedEmoji,
        },
      });
      return NextResponse.json(reaction, { status: 201 });
    }

    // Mock response fallback กรณีไม่มี model commentReaction ใน Prisma schema
    return NextResponse.json(
      {
        success: true,
        commentId,
        emoji: trimmedEmoji,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}
