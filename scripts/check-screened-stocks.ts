import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScreenedStocks() {
  const screenedStocks = await prisma.screenedStock.findMany({
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      stock: {
        select: {
          market: true,
          currency: true,
        },
      },
    },
  });

  console.log(`Found ${screenedStocks.length} screened stocks:\n`);
  screenedStocks.forEach(stock => {
    console.log(`${stock.symbol} (${stock.stock?.market}) - ${stock.date.toISOString().split('T')[0]} - Score: ${stock.passedCriteria}/14`);
  });

  const totalUS = await prisma.screenedStock.count({
    where: {
      stock: { market: 'US' },
    },
  });

  const totalTH = await prisma.screenedStock.count({
    where: {
      stock: { market: 'TH' },
    },
  });

  console.log(`\nTotal US screened: ${totalUS}`);
  console.log(`Total TH screened: ${totalTH}`);

  await prisma.$disconnect();
}

checkScreenedStocks();
