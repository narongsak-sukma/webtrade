/**
 * Fetch S&P 500 Tickers from Wikipedia
 *
 * This script scrapes the official S&P 500 list from Wikipedia
 * and returns all ticker symbols.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Sp500Stock {
  symbol: string;
  name: string;
  sector: string;
}

/**
 * Fetch S&P 500 tickers from Wikipedia
 */
async function fetchSp500Tickers(): Promise<Sp500Stock[]> {
  console.log('📥 Fetching S&P 500 tickers from Wikipedia...\n');

  try {
    const response = await fetch('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies');
    const html = await response.text();

    // Find the table with id "constituents"
    const tableMatch = html.match(/<table[^>]*id="constituents"[^>]*>([\s\S]*?)<\/table>/);

    if (!tableMatch) {
      throw new Error('Could not find S&P 500 table on Wikipedia');
    }

    const tableHtml = tableMatch[1];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

    const stocks: Sp500Stock[] = [];

    // Skip header row (index 0) and extract data
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Extract all <td> elements
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
      if (!cells || cells.length < 4) continue;

      // First cell: Extract ticker symbol
      const tickerMatch = cells[0].match(/>([A-Z]{1,5}[\.\-]?[A-Z]{0,2})</);
      if (!tickerMatch) continue;

      const symbol = tickerMatch[1].trim();
      const cleanSymbol = symbol.replace(/\./g, '-');

      // Second cell: Extract company name (may have a link)
      const nameMatch = cells[1].match(/>([^<]+)</);
      const name = nameMatch ? nameMatch[1].trim() : `${symbol} Corp`;

      // Fourth cell (index 3): Extract sector
      let sector = 'Other';
      const sectorMatch = cells[3].match(/>([^<]+)</);
      if (sectorMatch) {
        sector = sectorMatch[1].replace(/&amp;/g, '&').replace(/&#160;/g, ' ').trim();
      }

      // Third cell: Extract sub-sector/industry (optional)
      const subSectorMatch = cells[2].match(/title="([^"]*)"/);
      const subSector = subSectorMatch ? subSectorMatch[1].trim() : '';

      // Skip if we already have this symbol
      if (stocks.some(s => s.symbol === cleanSymbol)) continue;

      stocks.push({
        symbol: cleanSymbol,
        name,
        sector: subSector || sector
      });
    }

    console.log(`✅ Found ${stocks.length} S&P 500 stocks\n`);
    return stocks;
  } catch (error) {
    console.error('❌ Error fetching S&P 500 tickers:', error);
    throw error;
  }
}

/**
 * Save S&P 500 tickers to database
 */
async function saveSp500Tickers(stocks: Sp500Stock[]) {
  console.log('💾 Saving S&P 500 tickers to database...\n');

  let saved = 0;
  let skipped = 0;

  for (const stock of stocks) {
    try {
      await prisma.stock.upsert({
        where: { symbol: stock.symbol },
        update: {
          name: stock.name,
          sector: stock.sector,
        },
        create: {
          symbol: stock.symbol,
          name: stock.name,
          exchange: 'NYSE/NASDAQ',
          sector: stock.sector,
        },
      });
      saved++;
    } catch (error) {
      console.error(`  ❌ Error saving ${stock.symbol}:`, error);
      skipped++;
    }
  }

  console.log(`\n✅ Saved ${saved} stocks to database`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} stocks due to errors`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'fetch';

  try {
    if (mode === 'fetch') {
      // Fetch and save tickers
      const stocks = await fetchSp500Tickers();
      await saveSp500Tickers(stocks);
    } else if (mode === 'list') {
      // Just list the tickers
      const stocks = await fetchSp500Tickers();
      console.log('\n📊 S&P 500 Stocks:\n');
      stocks.forEach(stock => {
        console.log(`  ${stock.symbol.padEnd(8)} - ${stock.name.padEnd(40)} [${stock.sector}]`);
      });
    } else {
      console.log(`
Usage:
  npx tsx scripts/fetch-sp500-tickers.ts fetch   Fetch and save S&P 500 tickers to DB
  npx tsx scripts/fetch-sp500-tickers.ts list    List S&P 500 tickers
      `);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { fetchSp500Tickers, Sp500Stock };
