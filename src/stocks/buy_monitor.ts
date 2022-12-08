import { NS } from "@ns";
import { results_file, Stock, StockHistory } from "/stocks/common";
import { getPlayerMoney } from "/lib/utils";

const BUY_AMOUNT = 50e6;
const HISTORY = 10;

function buyStock(ns: NS, chosen: StockHistory) {
    const qty = Math.floor(BUY_AMOUNT / chosen.prices[0])

    const buy_price = ns.stock.buyStock(chosen.name, qty);
    const new_price = Math.round(buy_price * 1.05);
    const stop_price = Math.round(buy_price * 0.90);

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
        
    if (!ns.fileExists(results_file)) {
        ns.print('Results file missing');
        return;
    }

    while (true) {
        while (getPlayerMoney(ns) < BUY_AMOUNT) {
            await ns.sleep(5 * 1000);
        }

        // load data from file
        const stocks: Stock[] = []
        const data = ns.read(results_file);
        for (const row of data.split('\r\n')) {
            const fields = row.split(',');
            stocks.push({
                name: fields[0],
                low: parseFloat(fields[1]),
                high: parseFloat(fields[2]),
                last_update: parseInt(fields[3])
            });
        }

        // cancel uncompleted orders
        let orders = ns.stock.getOrders();
        for (const sym in orders) {
            const curr = ns.stock.getPosition(sym);
            if (curr[0] === 0 && curr[2] === 0) {
                for (const order of orders[sym]) {
                    ns.stock.cancelOrder(sym, order.shares, order.price, order.type, order.position);
                }
            }
        }
        // update orders
        orders = ns.stock.getOrders();

        // chose the one closest to its min        
        let chosen: Stock | undefined;
        let chosen_percent = Infinity;
        for (const stock of stocks) {
            // don't pick stocks with ranges updated in the last 30 mins
            if (Date.now() - stock.last_update < 30 * 60 * 1000) continue;
            // don't pick stocks already picked once
            const pos = ns.stock.getPosition(stock.name);
            if (pos[0] > 0 || pos[2] > 0) continue;

            const p = (ns.stock.getPrice(stock.name) - stock.low) / (stock.high - stock.low);
            if (p < chosen_percent) {
                chosen_percent = p;
                chosen = stock;
            }
        }
        if (!chosen) {
            await ns.sleep(10 * 1000);
            continue;
        }
        ns.print(`Chosen: ${chosen.name}`);

        const stock_history: StockHistory = {
            name: chosen.name,
            prices: [ns.stock.getPrice(chosen.name)].concat((new Array(HISTORY - 1)).fill(Infinity)),
        };

        // wait while downward trend finishes
        ns.print('Waiting');
        while (ns.stock.getPrice(stock_history.name) <= stock_history.prices.reduce((a, b) => a + b, 0) / HISTORY) {
            while (stock_history.prices[0] === ns.stock.getPrice(stock_history.name)) {
                await ns.sleep(1 * 1000);
            }
            
            // we continue looping otherwise
            stock_history.prices.unshift(ns.stock.getPrice(stock_history.name));
            stock_history.prices.pop();

            await ns.sleep(4 * 1000);
        }
        ns.print('Wait over');

        // ns.print('Buy stub');
        buyStock(ns, stock_history);
    }
}