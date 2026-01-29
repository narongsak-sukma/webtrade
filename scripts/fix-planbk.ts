import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlanBK() {
  // Get all PLAN.BK records
  const plans = await prisma.screenedStock.findMany({
    where: { symbol: 'PLAN.BK' },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${plans.length} PLAN.BK records\n`);

  // Find the correct one (where actual checks match passedCriteria)
  let correctRecord = null;
  let badRecords = [];

  for (const record of plans) {
    const actualPasses = [
      record.priceAboveMa150,
      record.ma150AboveMa200,
      record.ma200TrendingUp,
      record.ma50AboveMa150,
      record.priceAboveMa50,
      record.priceAbove52WeekLow,
      record.priceNear52WeekHigh,
      record.relativeStrengthPositive,
      record.rsiInRange,
      record.volumeAboveAvg,
      record.macdBullish,
      record.adxStrong,
      record.priceAboveMa20,
      record.priceInBBRange,
    ].filter(Boolean).length;

    console.log(`ID: ${record.id}`);
    console.log(`  Created: ${record.createdAt.toISOString()}`);
    console.log(`  Score: ${record.passedCriteria}/14, Actual: ${actualPasses}/14`);

    if (actualPasses === record.passedCriteria) {
      if (!correctRecord) {
        console.log(`  ✓ This is the CORRECT record`);
        correctRecord = record;
      } else {
        console.log(`  ⚠️  Another correct record?`);
        badRecords.push(record);
      }
    } else {
      console.log(`  ✗ BAD record - data mismatch`);
      badRecords.push(record);
    }
    console.log();
  }

  // Delete bad records
  if (badRecords.length > 0) {
    console.log(`Deleting ${badRecords.length} bad records...`);
    for (const record of badRecords) {
      await prisma.screenedStock.delete({
        where: { id: record.id },
      });
      console.log(`  ✓ Deleted ID ${record.id}`);
    }
  }

  console.log('\n✅ Cleanup complete!');

  // Verify final state
  const remaining = await prisma.screenedStock.count({
    where: { symbol: 'PLAN.BK' },
  });
  console.log(`\nRemaining PLAN.BK records: ${remaining}`);

  await prisma.$disconnect();
}

fixPlanBK();
