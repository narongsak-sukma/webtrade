import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDates() {
  const dates = await prisma.screenedStock.groupBy({
    by: ['date'],
    where: { stock: { market: 'TH' } },
    _count: { symbol: true },
    orderBy: { date: 'desc' },
  });

  console.log('Thai screening dates:');
  dates.forEach(d => {
    console.log(`  ${d.date.toISOString().split('T')[0]}: ${d._count.symbol} stocks`);
  });

  // Get latest date
  const latest = await prisma.screenedStock.findFirst({
    where: { stock: { market: 'TH' } },
    orderBy: { date: 'desc' },
    select: { date: true }
  });

  console.log(`\nLatest screening: ${latest?.date.toISOString().split('T')[0]}`);

  await prisma.$disconnect();
}

checkDates();
