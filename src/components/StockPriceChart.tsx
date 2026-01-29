'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PriceData {
  date: string;
  price: number;
  volume: number;
  ma20?: number | null;
  ma50?: number | null;
  ma150?: number | null;
  ma200?: number | null;
}

interface StockPriceChartProps {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  currentPrice: number;
  onClose: () => void;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export function StockPriceChart({
  symbol,
  name,
  market,
  currency,
  currentPrice,
  onClose,
}: StockPriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = currency === 'THB' ? '฿' : '$';
  const marketIcon = market === 'TH' ? '🇹🇭' : '🇺🇸';
  const numericPrice = typeof currentPrice === 'number' ? currentPrice : parseFloat(currentPrice as any) || 0;

  useEffect(() => {
    fetchPriceData();
  }, [symbol, timeRange]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'ALL':
          startDate = new Date('2020-01-01');
          break;
      }

      const res = await fetch(
        `/api/stock/${symbol}/prices?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch price data');
      }

      const data = await res.json();

      // Format data for chart
      const formattedData = data.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        price: parseFloat(item.close),
        volume: parseInt(item.volume),
        ma20: item.ma20 ? parseFloat(item.ma20) : null,
        ma50: item.ma50 ? parseFloat(item.ma50) : null,
        ma150: item.ma150 ? parseFloat(item.ma150) : null,
        ma200: item.ma200 ? parseFloat(item.ma200) : null,
      }));

      setPriceData(formattedData);
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-tertiary border border-border rounded-lg p-3 shadow-xl">
          <p className="text-text-secondary text-xs mb-2">{data.date}</p>
          <p className="text-white font-semibold">
            Price: {currencySymbol}
            {data.price.toFixed(2)}
          </p>
          {data.volume && (
            <p className="text-text-tertiary text-xs mt-1">
              Vol: {(data.volume / 1000000).toFixed(2)}M
            </p>
          )}
          {data.ma20 && (
            <p className="text-blue-400 text-xs">MA20: {currencySymbol}{data.ma20.toFixed(2)}</p>
          )}
          {data.ma50 && (
            <p className="text-emerald-400 text-xs">MA50: {currencySymbol}{data.ma50.toFixed(2)}</p>
          )}
          {data.ma200 && (
            <p className="text-purple-400 text-xs">MA200: {currencySymbol}{data.ma200.toFixed(2)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const calculateChange = () => {
    if (priceData.length < 2) return { value: 0, percentage: 0 };
    const first = priceData[0].price;
    const last = priceData[priceData.length - 1].price;
    const value = last - first;
    const percentage = ((value / first) * 100);
    return { value, percentage };
  };

  const change = calculateChange();
  const isPositive = change.value >= 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface-secondary border border-border rounded-2xl p-8 max-w-4xl w-full">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-medium">Loading price data...</p>
            <p className="text-text-secondary text-sm mt-2">Fetching historical prices</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface-secondary border border-border rounded-2xl p-8 max-w-4xl w-full">
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-16 h-16 text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white text-lg font-medium">Error Loading Data</p>
            <p className="text-text-secondary text-sm mt-2">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-secondary border border-border rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{marketIcon}</span>
                <h2 className="text-3xl font-bold text-white">{symbol}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  market === 'TH'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {market}
                </span>
              </div>
              <p className="text-text-secondary text-lg">{name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Price & Change */}
          <div className="mt-4 flex items-baseline gap-4">
            <div className="text-4xl font-bold text-white">
              {currencySymbol}
              {numericPrice.toFixed(2)}
            </div>
            <div className={`flex items-center gap-2 text-lg font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span>{isPositive ? '+' : ''}{currencySymbol}{change.value.toFixed(2)}</span>
              <span className="text-text-secondary">({isPositive ? '+' : ''}{change.percentage.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="px-6 py-3 border-b border-border bg-surface-tertiary/50">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm font-medium mr-2">Time Range:</span>
            {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface-secondary text-text-secondary hover:text-white hover:bg-surface-hover border border-border'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Price Chart */}
          <div className="bg-surface-tertiary border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                  activeDot={{ r: 6 }}
                />
                {priceData.some((d) => d.ma20) && (
                  <Line
                    type="monotone"
                    dataKey="ma20"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    dot={false}
                    name="MA20"
                    strokeDasharray="5 5"
                  />
                )}
                {priceData.some((d) => d.ma50) && (
                  <Line
                    type="monotone"
                    dataKey="ma50"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    dot={false}
                    name="MA50"
                    strokeDasharray="5 5"
                  />
                )}
                {priceData.some((d) => d.ma200) && (
                  <Line
                    type="monotone"
                    dataKey="ma200"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    dot={false}
                    name="MA200"
                    strokeDasharray="5 5"
                  />
                )}
                <ReferenceLine
                  yValue={numericPrice}
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{ value: 'Current', fill: '#F59E0B', fontSize: 12 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="bg-surface-tertiary border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface-tertiary border border-border rounded-lg p-3 shadow-xl">
                          <p className="text-text-secondary text-xs mb-1">{payload[0].payload.date}</p>
                          <p className="text-white font-semibold">
                            Vol: {(payload[0].value / 1000000).toFixed(2)}M
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill="rgba(0, 212, 170, 0.6)"
                  name="Volume"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-tertiary border border-border rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">High (Period)</p>
              <p className="text-white font-semibold text-lg">
                {currencySymbol}
                {Math.max(...priceData.map((d) => d.price)).toFixed(2)}
              </p>
            </div>
            <div className="bg-surface-tertiary border border-border rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Low (Period)</p>
              <p className="text-white font-semibold text-lg">
                {currencySymbol}
                {Math.min(...priceData.map((d) => d.price)).toFixed(2)}
              </p>
            </div>
            <div className="bg-surface-tertiary border border-border rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Avg Volume</p>
              <p className="text-white font-semibold text-lg">
                {(priceData.reduce((sum, d) => sum + d.volume, 0) / priceData.length / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="bg-surface-tertiary border border-border rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Data Points</p>
              <p className="text-white font-semibold text-lg">{priceData.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
