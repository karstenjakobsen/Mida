/*
 * Copyright Reiryoku Technologies and its contributors, www.reiryoku.com, www.mida.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

import { MidaTradingAccount, } from "#accounts/MidaTradingAccount";
import { MidaDecimal, } from "#decimals/MidaDecimal";
import { MidaEvent, } from "#events/MidaEvent";
import { MidaIndicator, } from "#indicators/MidaIndicator";
import { MidaPeriod, } from "#periods/MidaPeriod";
import { MidaLiveIndicatorParameters, } from "#utilities/live/MidaLiveIndicatorParameters";
import { MidaMarketWatcher, } from "#watchers/MidaMarketWatcher";

const liveIndicators: WeakMap<object, MidaMarketWatcher> = new WeakMap();
const livePeriods: WeakMap<object, MidaMarketWatcher> = new WeakMap();

export const makeLiveIndicator = async ({
    indicator,
    input,
    tradingAccount,
    onUpdate,
}: MidaLiveIndicatorParameters): Promise<MidaIndicator> => {
    if (liveIndicators.has(indicator)) {
        return indicator;
    }

    const price: "open" | "high" | "low" | "close" = input.price ?? "close";
    const periods: MidaPeriod[] = await tradingAccount.getSymbolPeriods(input.symbol, input.timeframe);

    indicator.clear();
    await indicator.next(periods.map((period): MidaDecimal => period[price]));

    const marketWatcher: MidaMarketWatcher = new MidaMarketWatcher({ tradingAccount, });

    await marketWatcher.watch(input.symbol, {
        watchPeriods: true,
        timeframes: [ input.timeframe, ],
    });

    marketWatcher.on("period-close", async (event: MidaEvent): Promise<void> => {
        const { period, } = event.descriptor;

        await indicator.next([ period[price], ]);

        onUpdate?.(event);
    });

    liveIndicators.set(indicator, marketWatcher);

    return indicator;
};

export const endLiveIndicator = async (indicator: MidaIndicator): Promise<MidaIndicator> => {
    const marketWatcher: MidaMarketWatcher | undefined = liveIndicators.get(indicator);

    if (marketWatcher) {
        await marketWatcher.unwatch(marketWatcher.watchedSymbols[0]);
        liveIndicators.delete(indicator);
    }

    return indicator;
};

export const makeLivePeriods = async (symbol: string, timeframe: number, tradingAccount: MidaTradingAccount): Promise<MidaPeriod[]> => {
    const periods: MidaPeriod[] = await tradingAccount.getSymbolPeriods(symbol, timeframe);
    const marketWatcher: MidaMarketWatcher = new MidaMarketWatcher({ tradingAccount, });

    await marketWatcher.watch(symbol, {
        watchPeriods: true,
        timeframes: [ timeframe, ],
    });

    marketWatcher.on("period-close", async (event: MidaEvent): Promise<void> => {
        const { period, } = event.descriptor;

        periods.push(period);
    });

    livePeriods.set(periods, marketWatcher);

    return periods;
};

export const makeLivePrices = async (symbol: string, tradingAccount: MidaTradingAccount): Promise<MidaDecimal[]> => {
    const livePrices: MidaDecimal[] = [];
    const marketWatcher: MidaMarketWatcher = new MidaMarketWatcher({ tradingAccount, });

    await marketWatcher.watch(symbol, {
        watchTicks: true,
    });

    livePrices[0] = await tradingAccount.getSymbolBid(symbol);
    livePrices[1] = await tradingAccount.getSymbolAsk(symbol);

    marketWatcher.on("tick", async (event: MidaEvent): Promise<void> => {
        const { tick, } = event.descriptor;

        livePrices[0] = tick.bid;
        livePrices[1] = tick.ask;
    });

    return livePrices;
};

export const endLivePrices = async (): Promise<void> => {

};
