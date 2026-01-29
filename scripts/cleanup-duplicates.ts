import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Checking for duplicate screening results...\n');

  // Find all symbols that have multiple records on the same date
  const duplicates = await prisma.$queryRaw`
    SELECT symbol, date, COUNT(*) as count
    FROM "screened_stocks"
    GROUP BY symbol, date
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;

  console.log(`Found ${duplicates.length} symbols with duplicate records on same date:\n`);

  for (const dup of duplicates as any[]) {
    console.log(`${dup.symbol} on ${dup.date.toISOString().split('T')[0]}: ${dup.count} records`);

    // Get all records for this symbol+date
    const records = await prisma.screenedStock.findMany({
      where: {
        symbol: dup.symbol,
        date: dup.date,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Keep the first one (latest created), delete the rest
    const toKeep = records[0];
    const toDelete = records.slice(1);

    console.log(`  Keeping: ID ${toKeep.id} (created ${toKeep.createdAt.toISOString()})`);
    console.log(`  Deleting ${toDelete.length} older records...`);

    for (const record of toDelete) {
      await prisma.screenedStock.delete({
        where: { id: record.id },
      });
    }

    console.log(`  ✓ Cleaned up\n`);
  }

  console.log('\n✅ Cleanup complete!');

  await prisma.$disconnect();
}

cleanupDuplicates();
