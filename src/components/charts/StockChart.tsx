'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

// Types matching agent-contracts.ts
export interface PriceDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  type: 'MA' | 'RSI' | 'MACD' | 'BB' | 'OBV' | 'Ichimoku';
  period?: number;
  params?: Record<string, number>;
  color?: string;
  visible?: boolean;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface StockChartProps {
  symbol: string;
  data: PriceDataPoint[];
  indicators?: IndicatorConfig[];
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  height?: number;
  interactive?: boolean;
}

// Custom tooltip with elegant styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const date = label instanceof Date ? label : new Date(label);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        {format(date, 'MMM dd, yyyy')}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
          </span>
          <span className="font-semibold text-gray-900">
            ${entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function StockChart({
  symbol,
  data,
  indicators = [],
  timeframe = '1M',
  onTimeframeChange,
  height = 400,
  interactive = true,
}: StockChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('area');
  const [loading, setLoading] = useState(false);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const timeframes = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
      'ALL': Infinity,
    };

    const days = timeframes[timeframe];
    if (days === Infinity) return data;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return data.filter((d) => new Date(d.date) >= cutoff);
  }, [data, timeframe]);

  // Calculate moving averages
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    return filteredData.map((item, index) => {
      const ma50 = calculateMA(filteredData, index, 50);
      const ma150 = calculateMA(filteredData, index, 150);
      const ma200 = calculateMA(filteredData, index, 200);

      return {
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        ma50: ma50 || null,
        ma150: ma150 || null,
        ma200: ma200 || null,
      };
    });
  }, [filteredData]);

  // Calculate price change for styling
  const priceChange = useMemo(() => {
    if (!chartData.length) return 0;
    const first = chartData[0].close;
    const last = chartData[chartData.length - 1].close;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const isPositive = priceChange >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444'; // green-500 : red-500

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No data available</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the timeframe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Chart Type:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartType === 'area'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartType === 'candlestick'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Candle
              </button>
            </div>
          </div>

          {onTimeframeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Timeframe:</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => onTimeframeChange(tf)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Change Badge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">Current: </span>
          <span className="text-2xl font-bold text-gray-900">
            ${chartData[chartData.length - 1].close.toFixed(2)}
          </span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isPositive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {isPositive ? '+' : ''}
          {priceChange.toFixed(2)}%
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ height: `${height}px` }} className="bg-white rounded-lg border border-gray-200 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`colorClose-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="close"
                name="Price"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#colorClose-${symbol})`}
                animationDuration={1000}
              />
              {indicators.find((i) => i.type === 'MA' && i.visible !== false) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="ma50"
                    name="MA50"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma150"
                    name="MA150"
                    stroke="#8b5cf6"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma200"
                    name="MA200"
                    stroke="#ec4899"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                name="Price"
                stroke={strokeColor}
                strokeWidth={2.5}
                dot={false}
                animationDuration={1000}
                activeDot={{ r: 6, fill: strokeColor, strokeWidth: 2 }}
              />
              {indicators.find((i) => i.type === 'MA' && i.visible !== false) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="ma50"
                    name="MA50"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma150"
                    name="MA150"
                    stroke="#8b5cf6"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma200"
                    name="MA200"
                    stroke="#ec4899"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </LineChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="high"
                name="High"
                stroke="#10b981"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="low"
                name="Low"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="open"
                name="Open"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="close"
                name="Close"
                stroke={strokeColor}
                strokeWidth={2.5}
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div style={{ height: '120px' }} className="bg-white rounded-lg border border-gray-200 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
            />
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString(),
                'Volume',
              ]}
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Area
              type="monotone"
              dataKey="volume"
              name="Volume"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Helper: Calculate Moving Average
function calculateMA(data: any[], index: number, period: number): number | null {
  if (index < period - 1) return null;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[index - i].close;
  }

  return sum / period;
}
