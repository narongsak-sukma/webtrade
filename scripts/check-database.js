const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database...\n');

    // Check stocks
    const stockCount = await prisma.stock.count();
    console.log('Total stocks in DB:', stockCount);

    // Check screened stocks
    const screenedCount = await prisma.screenedStock.count();
    console.log('Screened stocks:', screenedCount);

    // Check recent screenings (last 24 hours)
    const recentScreened = await prisma.screenedStock.count({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }
      }
    });
    console.log('Screened in last 24h:', recentScreened);

    // Check stocks that passed criteria (>= 6 points)
    const passedCount = await prisma.screenedStock.count({
      where: {
        passedCriteria: { gte: 6 }
      }
    });
    console.log('Passed criteria (>=6):', passedCount);

    // Get some sample data
    if (screenedCount > 0) {
      const samples = await prisma.screenedStock.findMany({
        take: 3,
        include: { stock: { select: { name: true } } },
        orderBy: { date: 'desc' }
      });
      console.log('\nSample screened stocks:');
      samples.forEach(s => {
        const stockName = s.stock ? s.stock.name : 'N/A';
        console.log(`  - ${s.symbol}: ${stockName} | Signal: ${s.signal} | Passed: ${s.passedCriteria}/8`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
