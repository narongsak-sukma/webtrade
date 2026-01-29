'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';

import { PriceDataPoint, IndicatorConfig } from './StockChart';

export interface IndicatorChartProps {
  symbol: string;
  data: PriceDataPoint[];
  indicators: IndicatorConfig[];
  height?: number;
}

// Custom tooltip for indicators
const IndicatorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const date = label instanceof Date ? label : new Date(label);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-xs font-semibold text-gray-900 mb-2">
        {format(date, 'MMM dd, yyyy')}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
          </span>
          <span className="font-semibold text-gray-900">
            {entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function IndicatorChart({
  symbol,
  data,
  indicators,
  height = 200,
}: IndicatorChartProps) {
  // Calculate RSI
  const rsiData = useMemo(() => {
    if (!indicators.find((i) => i.type === 'RSI' && i.visible !== false)) return [];

    const period = indicators.find((i) => i.type === 'RSI')?.period || 14;
    const rsiValues = calculateRSI(data, period);

    return data.map((item, index) => ({
      date: item.date,
      rsi: rsiValues[index],
    }));
  }, [data, indicators]);

  // Calculate MACD
  const macdData = useMemo(() => {
    if (!indicators.find((i) => i.type === 'MACD' && i.visible !== false)) return [];

    const macdConfig = indicators.find((i) => i.type === 'MACD');
    const fastPeriod = macdConfig?.params?.fast || 12;
    const slowPeriod = macdConfig?.params?.slow || 26;
    const signalPeriod = macdConfig?.params?.signal || 9;

    const { macd, signal, histogram } = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);

    return data.map((item, index) => ({
      date: item.date,
      macd: macd[index],
      signal: signal[index],
      histogram: histogram[index],
    }));
  }, [data, indicators]);

  // Calculate Bollinger Bands
  const bbData = useMemo(() => {
    if (!indicators.find((i) => i.type === 'BB' && i.visible !== false)) return [];

    const bbConfig = indicators.find((i) => i.type === 'BB');
    const period = bbConfig?.period || 20;
    const stdDev = bbConfig?.params?.stdDev || 2;

    const { upper, middle, lower } = calculateBollingerBands(data, period, stdDev);

    return data.map((item, index) => ({
      date: item.date,
      price: item.close,
      upper: upper[index],
      middle: middle[index],
      lower: lower[index],
    }));
  }, [data, indicators]);

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No indicator data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* RSI Chart */}
      {indicators.find((i) => i.type === 'RSI' && i.visible !== false) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">RSI (14)</h4>
          <div style={{ height: `${height}px` }} className="bg-white rounded-lg border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rsiData}>
                <defs>
                  <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <Tooltip content={<IndicatorTooltip />} />
                {/* Overbought/Oversold zones */}
                <ReferenceArea y1={70} y2={100} fill="#fecaca" fillOpacity={0.3} />
                <ReferenceArea y1={0} y2={30} fill="#bbf7d0" fillOpacity={0.3} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="rsi"
                  name="RSI"
                  stroke="#8b5cf6"
                  fill="url(#rsiGradient)"
                  strokeWidth={2}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MACD Chart */}
      {indicators.find((i) => i.type === 'MACD' && i.visible !== false) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">MACD (12, 26, 9)</h4>
          <div style={{ height: `${height}px` }} className="bg-white rounded-lg border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={macdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip content={<IndicatorTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                {/* Histogram */}
                <Area
                  type="monotone"
                  dataKey="histogram"
                  name="Histogram"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  stroke="#3b82f6"
                  strokeWidth={0}
                />
                {/* MACD Line */}
                <Line
                  type="monotone"
                  dataKey="macd"
                  name="MACD"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                />
                {/* Signal Line */}
                <Line
                  type="monotone"
                  dataKey="signal"
                  name="Signal"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bollinger Bands Chart */}
      {indicators.find((i) => i.type === 'BB' && i.visible !== false) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Bollinger Bands (20, 2)</h4>
          <div style={{ height: `${height}px` }} className="bg-white rounded-lg border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bbData}>
                <defs>
                  <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<IndicatorTooltip />} />
                {/* Upper Band */}
                <Line
                  type="monotone"
                  dataKey="upper"
                  name="Upper Band"
                  stroke="#ef4444"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                {/* Lower Band */}
                <Line
                  type="monotone"
                  dataKey="lower"
                  name="Lower Band"
                  stroke="#22c55e"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                {/* Fill between bands */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  fill="url(#bbFill)"
                  stroke="none"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  fill="#ffffff"
                  stroke="none"
                />
                {/* Middle Band (SMA) */}
                <Line
                  type="monotone"
                  dataKey="middle"
                  name="Middle Band (SMA)"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                />
                {/* Price */}
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Calculate RSI
function calculateRSI(data: PriceDataPoint[], period: number): (number | null)[] {
  const rsiValues: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsiValues.push(null);
      continue;
    }

    let gains = 0;
    let losses = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].close - data[j - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }

  return rsiValues;
}

// Helper: Calculate MACD
function calculateMACD(
  data: PriceDataPoint[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
) {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const macd = emaFast.map((fast, i) => (fast !== null && emaSlow[i] !== null ? fast - emaSlow[i]! : null));

  const macdData = data.map((_, i) => ({ close: macd[i] || 0 }));
  const signal = calculateEMA(macdData, signalPeriod);

  const histogram = macd.map((m, i) => (m !== null && signal[i] !== null ? m - signal[i]! : null));

  return { macd, signal, histogram };
}

// Helper: Calculate EMA
function calculateEMA(data: { close: number }[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate first SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i].close;
    ema.push(null);
  }

  if (data.length >= period) {
    ema[period - 1] = sum / period;

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
      ema[i] = (data[i].close - ema[i - 1]!) * multiplier + ema[i - 1]!;
    }
  }

  return ema;
}

// Helper: Calculate Bollinger Bands
function calculateBollingerBands(
  data: PriceDataPoint[],
  period: number,
  stdDevMultiplier: number
) {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }

    // Calculate SMA (Middle Band)
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    const sma = sum / period;
    middle[i] = sma;

    // Calculate Standard Deviation
    let squaredDiffsSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - sma;
      squaredDiffsSum += diff * diff;
    }
    const stdDev = Math.sqrt(squaredDiffsSum / period);

    upper[i] = sma + (stdDevMultiplier * stdDev);
    lower[i] = sma - (stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}
