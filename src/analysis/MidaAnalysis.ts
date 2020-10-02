import {MidaCongestionArea} from "#analysis/congestion/MidaCongestionArea";
import {MidaSwingPoint} from "#analysis/swing/MidaSwingPoint";
import {MidaSwingPointType} from "#analysis/swing/MidaSwingPointType";
import {MidaForexPairPeriod} from "#forex/MidaForexPairPeriod";
import {MidaForexPairTrendType} from "#forex/MidaForexPairTrendType";
import {MidaForexPairExchangeRate} from "#forex/MidaForexPairExchangeRate";

const Tulind: any = require("tulind");

// Very Important Points:
// 1. All periods and prices passed as parameters must be ordered from oldest to newest.
// 2. All returned periods and prices are ordered from oldest to newest.
export module MidaAnalysis {
    export async function calculateRSI (closePrices: number[], length: number): Promise<number[]> {
        return new Promise((resolve: (...parameters: any[]) => void, reject: (...parameters: any[]) => void): void => {
            Tulind.indicators.rsi.indicator([ closePrices, ], [ length, ], (error: any, results: any): void => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }

    export async function calculateSMA (prices: number[], length: number): Promise<number[]> {
        return new Promise((resolve: (...parameters: any[]) => void, reject: (...parameters: any[]) => void): void => {
            Tulind.indicators.sma.indicator([ prices, ], [ length, ], (error: any, results: any): void => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }

    export async function calculateEMA (prices: number[], length: number): Promise<number[]> {
        return new Promise((resolve: (...parameters: any[]) => void, reject: (...parameters: any[]) => void): void => {
            Tulind.indicators.ema.indicator([ prices, ], [ length, ], (error: any, results: any): void => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }

    export async function calculateBB (prices: number[], length: number, multiplier: number): Promise<number[][]> {
        return new Promise((resolve: (...parameters: any[]) => void, reject: (...parameters: any[]) => void): void => {
            Tulind.indicators.bbands.indicator([ prices, ], [ length, multiplier, ], (error: any, results: any): void => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve([
                        // Represents the lower band.
                        results[0],

                        // Represents the middle band.
                        results[1],

                        // Represents the upper band.
                        results[2],
                    ]);
                }
            });
        });
    }

    export async function calculateSTOCH (prices: number[][], length: number, k: number, d: number): Promise<number[][]> {
        return new Promise((resolve: (...parameters: any[]) => void, reject: (...parameters: any[]) => void): void => {
            Tulind.indicators.stoch.indicator([
                    // Represents the high prices.
                    prices[0],

                    // Represents the low prices.
                    prices[1],

                    // Represents the close prices.
                    prices[2],
                ],
                [ length, k, d, ],
                (error: any, results: any): void => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve([
                            // Represents k.
                            results[0],

                            // Represents d.
                            results[1],
                        ]);
                    }
                }
            );
        });
    }

    // Try using momentum of swing points.
    export function calculateCongestionAreaV1 (periods: MidaForexPairPeriod[], maxDistance: number = 0.05): MidaCongestionArea | null {
        const closePrices: number[] = periods.map((period: MidaForexPairPeriod): number => period.close);
        const minPrice: number = Math.min(...closePrices);
        const maxPrice: number = Math.max(...closePrices);
        const averagePrice: number = closePrices.reduce((leftPrice: number, rightPrice: number): number => leftPrice + rightPrice, 0) / closePrices.length;
        const distance: number = averagePrice / ((minPrice + maxPrice) / 2);

        if (distance < 1 - maxDistance || distance > 1 + maxDistance) {
            return null;
        }

        return {
            periods,
            averagePrice,
            supportPrice: Math.min(...periods.map((period: MidaForexPairPeriod): number => period.low)),
            resistancePrice: Math.max(...periods.map((period: MidaForexPairPeriod): number => period.high)),
        };
    }

    // TODO: Ragionare per rette e coefficienti angolari.
    // TODO: Take into account also rejections.
    export function calculateTrendV1 (periods: MidaForexPairPeriod[]): MidaForexPairTrendType {
        const swingPointsLow: MidaSwingPoint[] = calculateSwingPointsV1(periods, MidaSwingPointType.LOW);
        const swingPointsHigh: MidaSwingPoint[] = calculateSwingPointsV1(periods, MidaSwingPointType.HIGH);
        let violatedLowSwingPoints: number = 0;
        let violatedHighSwingPoints: number = 0;

        for (let i: number = 0, length: number = swingPointsLow.length; i < length - 1; ++i) {
            for (let j: number = i + 1; j < length; ++j) {
                if (swingPointsLow[j].lastPeriod.close < swingPointsLow[i].lastPeriod.close) {
                    ++violatedLowSwingPoints;

                    break;
                }
            }
        }

        for (let i: number = 0, length: number = swingPointsHigh.length; i < length - 1; ++i) {
            for (let j: number = i + 1; j < length; ++j) {
                if (swingPointsHigh[j].lastPeriod.close > swingPointsHigh[i].lastPeriod.close) {
                    ++violatedHighSwingPoints;

                    break;
                }
            }
        }

        if (violatedLowSwingPoints > violatedHighSwingPoints) {
            return MidaForexPairTrendType.BEARISH;
        }
        else if (violatedHighSwingPoints > violatedLowSwingPoints) {
            return MidaForexPairTrendType.BULLISH;
        }

        return MidaForexPairTrendType.NEUTRAL;
    }

    export function calculateTicksTrendV1 (ticks: MidaForexPairExchangeRate[]): MidaForexPairTrendType {
        let bullishTicksLength: number = 0;
        let bearishTicksLength: number = 0;

        for (let i: number = 0, length: number = ticks.length - 1; i < length; ++i) {
            const tick: MidaForexPairExchangeRate = ticks[i];
            const nextTick: MidaForexPairExchangeRate = ticks[i + 1];

            if (nextTick.bid < tick.bid && nextTick.ask < tick.ask) {
                ++bearishTicksLength;
            }
            else if (nextTick.bid > tick.bid && nextTick.ask > tick.ask) {
                ++bullishTicksLength;
            }
        }

        if (bearishTicksLength > bullishTicksLength) {
            return MidaForexPairTrendType.BEARISH;
        }
        else if (bullishTicksLength > bearishTicksLength) {
            return MidaForexPairTrendType.BULLISH;
        }

        return MidaForexPairTrendType.NEUTRAL;
    }

    export function calculateSwingPointsV1 (periods: MidaForexPairPeriod[], type: MidaSwingPointType, minLength: number = 2): MidaSwingPoint[] {
        const swingPoints: MidaSwingPoint[] = [];

        for (let i: number = 0, length: number = periods.length - 1; i < length; ++i) {
            const swingPointPeriods: MidaForexPairPeriod[] = [];

            while (
                periods[i + 1] && (
                    (type === MidaSwingPointType.LOW && periods[i + 1].close < periods[i].close) ||
                    (type === MidaSwingPointType.HIGH && periods[i + 1].close > periods[i].close)
                )
            ) {
                swingPointPeriods.push(periods[i + 1]);

                ++i;
            }

            if (swingPointPeriods.length >= minLength) {
                swingPoints.push(new MidaSwingPoint(swingPointPeriods, type));
            }
        }

        return swingPoints;
    }

    export function calculateHorizontalRejections (swingPoints: MidaSwingPoint[], maxDistance: number = 0.08): any[] {
        if (swingPoints.length < 2) {
            return [];
        }

        const priceRanges: number[][] = [];
        const includedSwingPoints: {
            [priceRangeHash: string]: MidaSwingPoint[];
        } = {};

        for (const swingPoint of swingPoints) {
            const closePrice: number = swingPoint.lastPeriod.close;
            const priceRange: number[] = [ closePrice - closePrice * maxDistance, closePrice + closePrice * maxDistance, ];

            priceRanges.push(priceRange);
            includedSwingPoints[priceRange[0].toString() + priceRange[1].toString()] = [];
        }

        return [];
    }
}