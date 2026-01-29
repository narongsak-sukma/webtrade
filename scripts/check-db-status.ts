import { prisma } from '../src/lib/prisma';

async function checkStatus() {
  const total = await prisma.stock.count();
  const screened = await prisma.screenedStock.count();
  const qualified = await prisma.screenedStock.count({
    where: { passedCriteria: { gte: 6 } }
  });

  // Get latest screening date
  const latestScreening = await prisma.screenedStock.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true }
  });

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('📊 DATABASE STATUS:');
  console.log(`   Total stocks: ${total}`);
  console.log(`   Screened: ${screened}`);
  console.log(`   Qualified (6+): ${qualified}`);

  if (latestScreening) {
    const isToday = latestScreening.date >= today;
    console.log(`\n📅 Latest Screening: ${latestScreening.date.toISOString()}`);
    console.log(`   ${isToday ? '✅ TODAY' : '⚠️  NOT TODAY'}`);
  }

  await prisma.$disconnect();
}

checkStatus();
