import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const screened = searchParams.get('screened');

    if (symbol) {
      // Get specific stock with latest price
      const stock = await prisma.stock.findUnique({
        where: { symbol },
        include: {
          prices: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      if (!stock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }

      return NextResponse.json(stock);
    }

    if (screened === 'true') {
      // Get screened stocks
      const screenedStocks = await prisma.screenedStock.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          passedCriteria: { gte: 6 },
        },
        include: {
          stock: {
            select: {
              name: true,
              sector: true,
              industry: true,
            },
          },
        },
        orderBy: {
          passedCriteria: 'desc',
        },
      });

      return NextResponse.json(screenedStocks);
    }

    // Get all stocks
    const stocks = await prisma.stock.findMany({
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      take: 100,
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
