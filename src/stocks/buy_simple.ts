import { NS } from "@ns";
import { StockHistory } from "/stocks/common";
import { getPlayerMoney } from "/lib/utils";

const HISTORY = 10;

function buyStock(ns: NS, chosen: StockHistory) {
    const qty = Math.floor(100e6 / chosen.prices[0])

    const buy_price = ns.stock.buyStock(chosen.name, qty);
    const new_price = Math.round(buy_price * 1.02);
    const stop_price = Math.round(buy_price * 0.97);

    ns.stock.placeOrder(chosen.name, qty, new_price, 'limit sell', 'long');
    ns.stock.placeOrder(chosen.name, qty, stop_price, 'stop sell', 'long');

    ns.print('Bought each share for: ', buy_price);
    ns.print('Selling each share for: ', new_price);
    ns.print('Stop each share for: ', stop_price);
    ns.print('');
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');
    ns.clearLog();
    ns.print('script start')
    ns.tail();

    while (true) {
        while (getPlayerMoney(ns) < 100e6) {
            await ns.sleep(5 * 1000);
        }        

        // cancel uncompleted orders
        const orders = ns.stock.getOrders();
        for (const sym in orders) {
            const curr = ns.stock.getPosition(sym);
            if (curr[0] === 0 && curr[2] === 0) {
                for (const order of orders[sym]) {
                    ns.stock.cancelOrder(sym, order.shares, order.price, order.type, order.position);
                }
            }
        }

        let stocks: StockHistory[] = []
        for (const sym of ns.stock.getSymbols()) {
            // strategy 1, 2, 5
            // stocks.push({
            //     name: sym,
            //     prices: [ns.stock.getPrice(sym)].concat((new Array(HISTORY - 1)).fill(Infinity)),
            // });

            // strategy 3, 4, 6
            stocks.push({
                name: sym,
                prices: [ns.stock.getPrice(sym)].concat((new Array(HISTORY - 1)).fill(0)),
            });
        }
        let n = stocks.length;
        ns.print('stocks left: ', n);

        while (stocks.length > 1) {
            n = stocks.length;
            while (stocks[0].prices[0] === ns.stock.getPrice(stocks[0].name)) {
                await ns.sleep(1 * 1000);
            }

            // strategy 1: buy stocks which trend downwards because they are bound to bounce back
            // stocks = stocks.filter((stock) => ns.stock.getPrice(stock.name) < Math.max(stock.price1, stock.price2, stock.price3));
            // strategy 2: buy stocks which trend downwards on AVG because they are bound to bounce back
            // strategy 5: buy stocks which trend downwards on AVG because they are bound to bounce back (longer duration)
            // stocks = stocks.filter((stock) => ns.stock.getPrice(stock.name) < stock.prices.reduce((a, b) => a + b, 0) / HISTORY);
            // strategy 3: buy stocks that trend upwards hoping they continue to do so
            // stocks = stocks.filter((stock) => ns.stock.getPrice(stock.name) > Math.min(stock.price1, stock.price2, stock.price3));
            // strategy 4: buy stocks that trend upwards on AVG hoping they continue to do so
            // strategy 6: buy stocks that trend upwards on AVG hoping they continue to do so (longer duration)
            stocks = stocks.filter((stock) => ns.stock.getPrice(stock.name) > stock.prices.reduce((a, b) => a + b, 0) / HISTORY);
            // stocks = stocks.filter((stock) => ns.stock.getPrice(stock.name) > [stock.price1, stock.price2, stock.price3].reduce((a, b) => a + b, 0) / 3);

            if (stocks.length === 0) {
                // we failed, try again from beginning
                break;
            } else if (stocks.length <= 5 && getPlayerMoney(ns) > 100e6 * stocks.length) {
                // if remaining stocks are <= 5 (sanity check)
                // and we have enough money to buy them all
                // then buy them all
                for (const stock of stocks) {
                    buyStock(ns, stock);
                }
                // break loop
                break;
            }
            // we continue looping otherwise
            for (const stock of stocks) {
                stock.prices.unshift(ns.stock.getPrice(stock.name));
                stock.prices.pop();
                // ns.print(`${stock.name}: ${stock.price}`)
            }
            ns.print('stocks left: ', n);

            await ns.sleep(4 * 1000);
        }

    }
}