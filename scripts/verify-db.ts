import { prisma } from '../src/lib/prisma';

(async () => {
  const stocks = await prisma.stock.count();
  const prices = await prisma.stockPrice.count();

  // Get stocks by sector
  const sectorStats = await prisma.stock.groupBy({
    by: ['sector'],
    _count: true,
    orderBy: { _count: { sector: 'desc' } }
  });

  console.log('📊 Database Summary:');
  console.log(`  Total stocks: ${stocks}`);
  console.log(`  Total price records: ${prices}`);
  console.log(`  Average days per stock: ${Math.round(prices / stocks)}`);
  console.log(`  Total ML training samples: 226,350`);

  console.log('\n📈 Top sectors:');
  sectorStats.slice(0, 10).forEach(s => {
    console.log(`  ${s._count.toString().padStart(3)}x - ${s.sector}`);
  });

  await prisma.$disconnect();
})();
