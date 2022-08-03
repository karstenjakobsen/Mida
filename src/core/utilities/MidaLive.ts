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

import { MidaMarketWatcher, } from "#watchers/MidaMarketWatcher";
import { MidaTradingAccount, } from "#accounts/MidaTradingAccount";
import { MidaDecimal, } from "#decimals/MidaDecimal";
import { MidaEventListener, } from "#events/MidaEventListener";

const liveSymbols: WeakMap<any, MidaMarketWatcher> = new WeakMap();

export type MidaLiveSymbol = {
    symbol: string;
    bid: MidaDecimal;
    ask: MidaDecimal;
};

export const makeLiveSymbol = async (symbol: string, tradingAccount: MidaTradingAccount, onUpdate?: MidaEventListener): Promise<MidaLiveSymbol> => {
    const marketWatcher: MidaMarketWatcher = new MidaMarketWatcher({ tradingAccount, });
    const liveSymbol: MidaLiveSymbol = {
        symbol,
        bid: await tradingAccount.getSymbolBid(symbol),
        ask: await tradingAccount.getSymbolAsk(symbol),
    };

    marketWatcher.on("tick", (event) => {
        const { bid, ask, } = event.descriptor.tick;

        liveSymbol.bid = bid;
        liveSymbol.ask = ask;

        onUpdate?.(event);
    });

    return liveSymbol;
};

export const closeLiveSymbol = async (symbol: string): Promise<void> => {
    const marketWatcher: MidaMarketWatcher | undefined = liveSymbols.get(symbol);

    if (!marketWatcher) {
        return;
    }

    marketWatcher.unwatch(symbol);
    liveSymbols.delete(symbol);
};
