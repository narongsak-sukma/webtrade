import { StockDetailClient } from './StockDetailClient';

async function getStockData(symbol: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks/${symbol}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch stock data');
  }

  return res.json();
}

export default async function StockDetailPage({
  params,
}: {
  params: { symbol: string };
}) {
  const data = await getStockData(params.symbol);

  return (
    <StockDetailClient
      symbol={data.stock.symbol}
      name={data.stock.name}
      exchange={data.stock.exchange}
      prices={data.prices}
      signals={data.signals}
    />
  );
}
