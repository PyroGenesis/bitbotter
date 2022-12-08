import { NS } from "@ns";
import { getPlayerMoney } from "/lib/utils";

interface StockTrend {
    name: string,
    prices: number[],
    trend: number[],

    getPrice: (idx: number) => number,
}

const BUY_AMOUNT = 100e6;
const HISTORY = 20;

function updatePriceAndTrend(ns: NS, stock: StockTrend) {
    const price = ns.stock.getPrice(stock.name);
    const last = stock.getPrice(-1);

    if (price > last) {
        stock.trend.push(1);
    } else if (price < last) {
        stock.trend.push(0);
    } else {
        stock.trend.push(0.5);
    }
    stock.prices.push(price);

    if (stock.prices.length > HISTORY+1) stock.prices.shift();
    if (stock.trend.length > HISTORY) stock.trend.shift();
}

const getTrend = (stock: StockTrend) => stock.trend.reduce((a, b) => a + b, 0);
const shouldBuyLong = (stock: StockTrend) => getTrend(stock) >= (HISTORY / 10) * 8; // 8, 16
const shouldSellLong = (stock: StockTrend) => getTrend(stock) <= (HISTORY / 2) + 1; // 6, 11
const shouldBuyShort = (stock: StockTrend) => getTrend(stock) <= (HISTORY / 10) * 2; // 2, 4
const shouldSellShort = (stock: StockTrend) => getTrend(stock) >= (HISTORY / 2) - 1; // 4, 9


function buyLongStock(ns: NS, chosen: {name: string, price: number}) {
    const qty = Math.floor(BUY_AMOUNT / chosen.price)

    const buy_price = ns.stock.buyStock(chosen.name, qty);
    const new_price = Math.round(buy_price * 1.05);
    const stop_price = Math.round(buy_price * 0.90);

    // ns.stock.placeOrder(chosen.name, qty, new_price, 'limit sell', 'long');
    // ns.stock.placeOrder(chosen.name, qty, stop_price, 'stop sell', 'long');

    ns.print('(LONG) Bought each share for: ', buy_price);
    // ns.print('Selling each share for: ', new_price);
    // ns.print('Stop each share for: ', stop_price);
    ns.print('');
}

function buyShortStock(ns: NS, chosen: {name: string, price: number}) {
    const qty = Math.floor(BUY_AMOUNT / chosen.price)

    const buy_price = ns.stock.buyShort(chosen.name, qty);

    ns.print('(SHORT) Bought each share for: ', buy_price);
    ns.print('');
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');
    ns.clearLog();
    ns.print('script start')
    ns.tail();

    // get a stocks list
    ns.print('Building stocks list...');
    const stocks: StockTrend[] = [];
    for (const sym of ns.stock.getSymbols()) {
        stocks.push({
            name: sym,
            prices: [ns.stock.getPrice(sym)],
            trend: [],

            getPrice: function(idx: number): number {
                if (idx >= 0) return this.prices[idx];
                return this.prices[this.prices.length + idx];
            }
        });
    }

    // fill the trends
    ns.print('Filling trends...');
    for (let i = 0; i < HISTORY; i++) {
        while (stocks[0].getPrice(-1) === ns.stock.getPrice(stocks[0].name)) {
            await ns.sleep(1 * 1000);
        }

        for (const stock of stocks) {
            updatePriceAndTrend(ns, stock);
        }
    }

    while (true) {
        // wait until stocks change
        while (stocks[0].getPrice(-1) === ns.stock.getPrice(stocks[0].name)) {
            await ns.sleep(1 * 1000);
        }

        const can_buy = getPlayerMoney(ns) >= BUY_AMOUNT;
        const best_long = { name: '', level: 0, price: 0 };
        const best_short = { name: '', level: 0, price: 0 };

        for (const stock of stocks) {
            // update price and trend
            updatePriceAndTrend(ns, stock);

            // check if stocks, shorts need to be sold
            const pos = ns.stock.getPosition(stock.name);
            if (pos[0] > 0 && shouldSellLong(stock)) {
                ns.stock.sellStock(stock.name, pos[0]);
            }
            if (pos[2] > 0 && shouldSellShort(stock)) {
                ns.stock.sellShort(stock.name, pos[2]);
            }

            // first only consider buying if we don't already own + we have the money
            if (pos[0] === 0 && pos[2] === 0 && can_buy) {
                const trend = getTrend(stock);

                // compare trends and save
                if (shouldBuyLong(stock) && (trend - (HISTORY / 2)) > best_long.level) {
                    best_long.name = stock.name;
                    best_long.price = stock.getPrice(-1);
                    best_long.level = trend - (HISTORY / 2);
                } else if (shouldBuyShort(stock) && ((HISTORY / 2) - trend) > best_short.level) {
                    best_short.name = stock.name;
                    best_short.price = stock.getPrice(-1);
                    best_short.level = (HISTORY / 2) - trend;
                }
            }
        }

        // buy
        if (best_long.level > 0 && best_long.level >= best_short.level) {
            buyLongStock(ns, best_long);
        }
        if (best_short.level > 0 && best_short.level >= best_long.level) {
            buyShortStock(ns, best_short);
        }
    }
}