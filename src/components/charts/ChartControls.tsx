'use client';

import React from 'react';
import { Timeframe, IndicatorConfig } from './StockChart';

export interface ChartControlsProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  indicators: IndicatorConfig[];
  onIndicatorToggle: (indicator: IndicatorConfig) => void;
  chartType: 'line' | 'area' | 'candlestick';
  onChartTypeChange: (type: 'line' | 'area' | 'candlestick') => void;
}

export default function ChartControls({
  timeframe,
  onTimeframeChange,
  indicators,
  onIndicatorToggle,
  chartType,
  onChartTypeChange,
}: ChartControlsProps) {
  const indicatorLabels: Record<string, string> = {
    MA: 'Moving Averages',
    RSI: 'RSI',
    MACD: 'MACD',
    BB: 'Bollinger Bands',
    OBV: 'On-Balance Volume',
    Ichimoku: 'Ichimoku Cloud',
  };

  const chartTypeLabels: Record<string, string> = {
    area: 'Area Chart',
    line: 'Line Chart',
    candlestick: 'Candlestick',
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Chart Type</h4>
        <div className="flex flex-wrap gap-2">
          {(['area', 'line', 'candlestick'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {chartTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeframe</h4>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Indicators</h4>
        <div className="space-y-2">
          {indicators.map((indicator) => {
            const isVisible = indicator.visible !== false;
            const label = indicatorLabels[indicator.type] || indicator.type;

            return (
              <button
                key={indicator.type}
                onClick={() => onIndicatorToggle(indicator)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  isVisible
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className={`text-sm font-medium ${isVisible ? 'text-blue-900' : 'text-gray-700'}`}>
                  {label}
                  {indicator.period && ` (${indicator.period})`}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isVisible ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}>
                  {isVisible && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Indicator Legend */}
        {indicators.some((i) => i.visible !== false) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">ACTIVE INDICATORS</p>
            <div className="flex flex-wrap gap-2">
              {indicators
                .filter((i) => i.visible !== false)
                .map((indicator) => {
                  const colors: Record<string, string> = {
                    MA: '#f59e0b', // amber
                    RSI: '#8b5cf6', // violet
                    MACD: '#3b82f6', // blue
                    BB: '#ef4444', // red
                    OBV: '#10b981', // green
                    Ichimoku: '#ec4899', // pink
                  };
                  const color = indicator.color || colors[indicator.type] || '#6b7280';
                  const label = indicatorLabels[indicator.type] || indicator.type;

                  return (
                    <div
                      key={indicator.type}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-700">{label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          onChartTypeChange('area');
          onTimeframeChange('1M');
          indicators.forEach((indicator) => {
            if (indicator.visible === false) {
              onIndicatorToggle({ ...indicator, visible: true });
            }
          });
        }}
        className="w-full px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset to Defaults
      </button>
    </div>
  );
}
