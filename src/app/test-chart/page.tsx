'use client';

import { useState } from 'react';
import { StockPriceChart } from '@/components/StockPriceChart';

export default function TestChartPage() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Stock Chart Test</h1>

        <div className="card-premium p-6">
          <p className="text-text-secondary mb-4">
            Click the button below to test the stock price chart component.
          </p>

          <button
            onClick={() => setShowChart(true)}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
          >
            Show ICE Stock Chart
          </button>
        </div>

        {showChart && (
          <StockPriceChart
            symbol="ICE"
            name="Intercontinental Exchange"
            market="US"
            currency="USD"
            currentPrice={5018.44}
            onClose={() => setShowChart(false)}
          />
        )}
      </div>
    </div>
  );
}
