/**
 * CHART COMPONENTS USAGE EXAMPLE
 *
 * This file demonstrates how to use the chart components in the TradingWeb application.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  StockChart,
  IndicatorChart,
  ChartControls,
  type PriceDataPoint,
  type IndicatorConfig,
  type Timeframe,
} from './index';

// Example usage in a page component
export default function StockDetailPageExample({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('area');

  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { type: 'MA', visible: true },
    { type: 'RSI', period: 14, visible: true },
    { type: 'MACD', params: { fast: 12, slow: 26, signal: 9 }, visible: true },
    { type: 'BB', period: 20, params: { stdDev: 2 }, visible: true },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/stocks/${symbol}`);
        const stockData = await response.json();

        // Transform API data to PriceDataPoint format
        const priceData: PriceDataPoint[] = stockData.prices.map((p: any) => ({
          date: new Date(p.date),
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        }));

        setData(priceData);
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol]);

  const handleIndicatorToggle = (indicator: IndicatorConfig) => {
    setIndicators((prev) =>
      prev.map((i) =>
        i.type === indicator.type ? { ...i, visible: !i.visible } : i
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{symbol} Analysis</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-3">
          <StockChart
            symbol={symbol}
            data={data}
            indicators={indicators}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            height={400}
            interactive={true}
          />
        </div>

        {/* Controls Sidebar */}
        <div className="lg:col-span-1">
          <ChartControls
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            indicators={indicators}
            onIndicatorToggle={handleIndicatorToggle}
            chartType={chartType}
            onChartTypeChange={setChartType}
          />
        </div>
      </div>

      {/* Indicator Charts */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Indicators</h2>
        <IndicatorChart
          symbol={symbol}
          data={data}
          indicators={indicators}
          height={200}
        />
      </div>
    </div>
  );
}

/**
 * INTEGRATION WITH EXISTING PAGES
 *
 * To integrate these charts into the existing stock detail page:
 *
 * 1. Import the components:
 *    import { StockChart, IndicatorChart, ChartControls } from '@/components/charts';
 *
 * 2. Fetch data server-side or client-side
 * 3. Transform data to PriceDataPoint format
 * 4. Pass props to components
 * 5. Handle user interactions
 */
