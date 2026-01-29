import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlanBK() {
  const plans = await prisma.screenedStock.findMany({
    where: { symbol: 'PLAN.BK' },
    include: { stock: { select: { symbol: true, name: true } } },
    orderBy: { date: 'desc' },
    take: 5,
  });

  console.log('PLAN.BK records:');
  plans.forEach(p => {
    console.log(`\nDate: ${p.date.toISOString().split('T')[0]}`);
    console.log(`Score: ${p.passedCriteria}/14`);
    const actualPasses = [
      p.priceAboveMa150,
      p.ma150AboveMa200,
      p.ma200TrendingUp,
      p.ma50AboveMa150,
      p.priceAboveMa50,
      p.priceAbove52WeekLow,
      p.priceNear52WeekHigh,
      p.relativeStrengthPositive,
      p.rsiInRange,
      p.volumeAboveAvg,
      p.macdBullish,
      p.adxStrong,
      p.priceAboveMa20,
      p.priceInBBRange,
    ].filter(Boolean).length;
    console.log(`Actual checks passed: ${actualPasses}/14`);
  });

  await prisma.$disconnect();
}

checkPlanBK();
