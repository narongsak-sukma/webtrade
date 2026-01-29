import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Zod schema for watchlist creation
const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be between 1 and 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

// GET /api/watchlists - Get all watchlists for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        stocks: {
          include: {
            stock: {
              select: {
                symbol: true,
                name: true,
                exchange: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(watchlists);
  } catch (error) {
    logger.error('Error fetching watchlists:', { error });
    return NextResponse.json(
      { error: 'Failed to fetch watchlists' },
      { status: 500 }
    );
  }
}

// POST /api/watchlists - Create new watchlist
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const validationResult = createWatchlistSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
      },
    });

    return NextResponse.json(watchlist, { status: 201 });
  } catch (error) {
    logger.error('Error creating watchlist:', { error });
    return NextResponse.json(
      { error: 'Failed to create watchlist' },
      { status: 500 }
    );
  }
}
