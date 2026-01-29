/**
 * Risk Management Service
 *
 * Calculates position sizing, stop-loss, portfolio risk, and trading limits
 * to prevent blowing up the trading account.
 *
 * @version 1.0.0
 */

export interface PositionSizingInput {
  accountBalance: number;
  riskPerTrade: number; // % of account to risk (usually 1-2%)
  entryPrice: number;
  stopLossPrice?: number;
  stopLossPercent?: number; // % stop loss (e.g., 0.05 = 5%)
  riskRewardRatio?: number; // target 3:1, 2:1, etc.
}

export interface PositionSizingOutput {
  shares: number;
  positionSize: number; // dollar amount
  riskAmount: number; // dollars at risk
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  maxLoss: number; // maximum loss if stop hits
  maxGain: number; // maximum gain if take profit hits
}

export interface PortfolioRiskInput {
  positions: {
    symbol: string;
    entryPrice: number;
    currentPrice: number;
    shares: number;
    stopLoss: number;
  }[];
  accountBalance: number;
  maxPortfolioHeat: number; // max % of account at risk (e.g., 0.20 = 20%)
}

export interface PortfolioRiskOutput {
  totalPositionSize: number;
  totalRisk: number; // dollars at risk if all stops hit
  portfolioHeat: number; // % of account at risk
  maxPositions: number;
  canAddNewPosition: boolean;
  riskPerPosition: number;
  warnings: string[];
}

export interface TradingLimitsInput {
  accountBalance: number;
  maxDrawdown: number; // max drawdown % (e.g., 0.15 = 15%)
  currentDrawdown: number;
  consecutiveLosses: number;
  maxConsecutiveLosses: number;
  dailyLossLimit: number; // max $ loss per day
}

export interface TradingLimitsOutput {
  canTrade: boolean;
  reasons: string[];
  recommendedActions: string[];
}

export class RiskManagementService {
  /**
   * Calculate position size using Fixed Fractional (Fixed %)
   * Most common and simple approach
   */
  calculateFixedFractionalPosition(input: PositionSizingInput): PositionSizingOutput {
    const {
      accountBalance,
      riskPerTrade,
      entryPrice,
      stopLossPrice,
      stopLossPercent,
    } = input;

    // Calculate stop loss
    let finalStopLoss = stopLossPrice;
    if (!finalStopLoss && stopLossPercent) {
      finalStopLoss = entryPrice * (1 - stopLossPercent);
    } else if (!finalStopLoss && !stopLossPercent) {
      finalStopLoss = entryPrice * 0.95; // Default 5% stop
    }

    // Risk amount per share
    const riskPerShare = entryPrice - finalStopLoss;

    // Amount to risk (in dollars)
    const riskAmount = accountBalance * riskPerTrade;

    // Number of shares
    const shares = Math.floor(riskAmount / riskPerShare);

    // Position size (total cost)
    const positionSize = shares * entryPrice;

    // Calculate take profit (default 3:1 risk-reward)
    const rewardPerShare = riskPerShare * (input.riskRewardRatio || 3);
    const takeProfitPrice = entryPrice + rewardPerShare;

    const riskRewardRatio = rewardPerShare / riskPerShare;

    return {
      shares,
      positionSize,
      riskAmount,
      stopLossPrice: finalStopLoss,
      takeProfitPrice,
      riskRewardRatio,
      maxLoss: riskPerShare * shares,
      maxGain: rewardPerShare * shares,
    };
  }

  /**
   * Calculate position size using Kelly Criterion
   * More aggressive, requires historical win rate data
   */
  calculateKellyPosition(
    input: PositionSizingInput & {
      winRate: number; // % of winning trades (0.50 = 50%)
      avgWin: number; // average winning trade $
      avgLoss: number; // average losing trade $ (absolute value)
    }
  ): PositionSizingOutput {
    const { accountBalance, winRate, avgWin, avgLoss, entryPrice } = input;

    // Kelly % = (W - (1-W) / R) where W = win rate, R = win/loss ratio
    const winLossRatio = avgWin / avgLoss;
    const kellyPercent = winRate - (1 - winRate) / winLossRatio;

    // Use half-Kelly for safety (more conservative)
    const halfKelly = kellyPercent / 2;

    // Limit to max 25% of account (very aggressive)
    const positionSizePercent = Math.min(halfKelly, 0.25);

    // Calculate shares
    const positionSize = accountBalance * positionSizePercent;
    const shares = Math.floor(positionSize / entryPrice);

    // Calculate stop loss (default ATR-based 2%)
    const stopLossPrice = entryPrice * 0.98;
    const riskPerShare = entryPrice - stopLossPrice;
    const takeProfitPrice = entryPrice + (riskPerShare * 3);

    return {
      shares,
      positionSize,
      riskAmount: riskPerShare * shares,
      stopLossPrice,
      takeProfitPrice,
      riskRewardRatio: 3,
      maxLoss: riskPerShare * shares,
      maxGain: (takeProfitPrice - entryPrice) * shares,
    };
  }

  /**
   * Calculate ATR-based stop loss
   * Uses volatility to set stop loss at appropriate distance
   */
  calculateATRStopLoss(
    entryPrice: number,
    atr: number,
    atrMultiplier: number = 2 // 2x ATR is common
  ): number {
    return entryPrice - (atr * atrMultiplier);
  }

  /**
   * Calculate portfolio risk metrics
   * Ensures you're not overexposed
   */
  calculatePortfolioRisk(input: PortfolioRiskInput): PortfolioRiskOutput {
    const { positions, accountBalance, maxPortfolioHeat } = input;

    let totalPositionSize = 0;
    let totalRisk = 0;

    positions.forEach(pos => {
      totalPositionSize += pos.currentPrice * pos.shares;
      totalRisk += (pos.entryPrice - pos.stopLoss) * pos.shares;
    });

    // Portfolio heat: % of account at risk
    const portfolioHeat = totalRisk / accountBalance;

    // Max positions based on heat limit
    const riskPerPosition = (accountBalance * maxPortfolioHeat) / positions.length;
    const maxPositions = Math.floor(accountBalance * maxPortfolioHeat / riskPerPosition);

    const warnings: string[] = [];

    if (portfolioHeat > maxPortfolioHeat) {
      warnings.push(`⚠️  Portfolio heat ${(portfolioHeat * 100).toFixed(1)}% exceeds limit ${(maxPortfolioHeat * 100).toFixed(1)}%`);
    }

    if (totalPositionSize > accountBalance * 2) {
      warnings.push(`⚠️  Total position size > ${(2 * 100).toFixed(0)}% of account balance (over-leveraged)`);
    }

    const concentratedPositions = positions.filter(
      pos => (pos.currentPrice * pos.shares) / accountBalance > 0.20
    );

    if (concentratedPositions.length > 0) {
      warnings.push(`⚠️  ${concentratedPositions.length} positions exceed 20% of account`);
    }

    return {
      totalPositionSize,
      totalRisk,
      portfolioHeat,
      maxPositions,
      canAddNewPosition: portfolioHeat < maxPortfolioHeat,
      riskPerPosition,
      warnings,
    };
  }

  /**
   * Check if trading should be paused due to limits
   */
  checkTradingLimits(input: TradingLimitsInput): TradingLimitsOutput {
    const {
      accountBalance,
      maxDrawdown,
      currentDrawdown,
      consecutiveLosses,
      maxConsecutiveLosses,
      dailyLossLimit,
    } = input;

    const reasons: string[] = [];
    const recommendedActions: string[] = [];
    let canTrade = true;

    // Check max drawdown
    if (currentDrawdown >= maxDrawdown) {
      canTrade = false;
      reasons.push(`Max drawdown reached: ${(currentDrawdown * 100).toFixed(1)}% >= ${(maxDrawdown * 100).toFixed(1)}%`);
      recommendedActions.push('⛔ STOP TRADING - Reduce position sizes or take a break');
      recommendedActions.push('📉 Review strategy performance before continuing');
    }

    // Check consecutive losses
    if (consecutiveLosses >= maxConsecutiveLosses) {
      canTrade = false;
      reasons.push(`Max consecutive losses: ${consecutiveLosses} >= ${maxConsecutiveLosses}`);
      recommendedActions.push('⛔ STOP TRADING - Something is wrong with the strategy');
      recommendedActions.push('🔍 Review recent trades and market conditions');
      recommendedActions.push('📊 Consider if market regime has changed');
    }

    // Warning: Approaching limits
    if (currentDrawdown >= maxDrawdown * 0.8) {
      recommendedActions.push(`⚠️  WARNING: Drawdown at ${(currentDrawdown * 100).toFixed(1)}%, ${(maxDrawdown * 100).toFixed(1)}% is max`);
      recommendedActions.push('📉 Reduce position sizes by 50%');
    }

    if (consecutiveLosses >= maxConsecutiveLosses * 0.7) {
      recommendedActions.push(`⚠️  WARNING: ${consecutiveLosses} consecutive losses, max is ${maxConsecutiveLosses}`);
      recommendedActions.push('⏸️ PAUSE - Take a break, review recent trades');
    }

    return {
      canTrade,
      reasons,
      recommendedActions,
    };
  }

  /**
   * Calculate risk-reward ratio
   */
  calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = takeProfit - entryPrice;
    return reward / risk;
  }

  /**
   * Validate if a trade meets minimum risk-reward criteria
   */
  isValidTrade(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    minRiskReward: number = 2.0
  ): boolean {
    const ratio = this.calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit);
    return ratio >= minRiskReward;
  }

  /**
   * Calculate optimal position size using volatility-adjusted sizing
   * Reduces size in high volatility, increases in low volatility
   */
  calculateVolatilityAdjustedPosition(
    accountBalance: number,
    entryPrice: number,
    stopLoss: number,
    atr: number,
    riskPerTrade: number = 0.02
  ): PositionSizingOutput {
    // Adjust position size based on volatility
    // Higher ATR = higher volatility = smaller position
    const volatilityFactor = entryPrice / (atr * 100); // Normalize

    // Scale factor (0.5 to 1.5 range)
    const scaleFactor = Math.min(Math.max(volatilityFactor, 0.5), 1.5);

    const adjustedRiskPercent = riskPerTrade * scaleFactor;

    return this.calculateFixedFractionalPosition({
      accountBalance,
      riskPerTrade: adjustedRiskPercent,
      entryPrice,
      stopLossPrice: stopLoss,
    });
  }

  /**
   * Calculate position correlation risk
   * Warns if adding too many correlated positions
   */
  calculateCorrelationRisk(
    existingPositions: string[],
    newSymbol: string,
    maxCorrelated: number = 3
  ): { canAdd: boolean; message: string } {
    // Simple sector-based correlation check
    const sectors: { [key: string]: string[] } = {
      Technology: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC'],
      Finance: ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS'],
      Healthcare: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY'],
      Consumer: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX'],
    };

    let sameSectorCount = 0;
    let sector = '';

    for (const [sec, symbols] of Object.entries(sectors)) {
      if (symbols.includes(newSymbol)) {
        sector = sec;
        sameSectorCount = existingPositions.filter(pos => symbols.includes(pos)).length;
        break;
      }
    }

    if (sameSectorCount >= maxCorrelated) {
      return {
        canAdd: false,
        message: `⚠️  Already have ${sameSectorCount} ${sector} positions. Adding ${newSymbol} increases sector concentration risk.`,
      };
    }

    return {
      canAdd: true,
      message: `✅ Can add ${newSymbol}. ${sameSectorCount} other ${sector || 'this sector'} positions.`,
    };
  }
}

export const riskManagementService = new RiskManagementService();
