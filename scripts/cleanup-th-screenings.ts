import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupThaiScreenings() {
  console.log('Cleaning up duplicate Thai screening results...\n');

  // Get all Thai stocks
  const stocks = await prisma.stock.findMany({
    where: { market: 'TH' },
    select: { symbol: true },
  });

  let deletedCount = 0;

  for (const { symbol } of stocks) {
    // Get all screening records for this stock
    const records = await prisma.screenedStock.findMany({
      where: { symbol },
      orderBy: { createdAt: 'desc' },
    });

    if (records.length > 1) {
      // Keep only the first one (latest created), delete the rest
      const toKeep = records[0];
      const toDelete = records.slice(1);

      console.log(`${symbol}: keeping ${toKeep.createdAt.toISOString()}, deleting ${toDelete.length} older records`);

      for (const record of toDelete) {
        await prisma.screenedStock.delete({
          where: { id: record.id },
        });
        deletedCount++;
      }
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} duplicate screening records`);

  // Verify final count
  const remaining = await prisma.screenedStock.count({
    where: { stock: { market: 'TH' } }
  });
  console.log(`Remaining Thai screening records: ${remaining}`);

  await prisma.$disconnect();
}

cleanupThaiScreenings();
