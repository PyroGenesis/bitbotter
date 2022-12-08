import { NS } from "@ns";
import { getPlayerMoney } from "/lib/utils";

interface Stock4S {
    name: string,
    // price: number,
    forecast: number,
    volatility: number,
    position: number[]
}

const COMMISSION = 1e5;
const LONG_BOUNDARY = 0.6;
const SHORT_BOUNDARY = 0.4;

const getNormalizedForecast = (stock: Stock4S) => Math.abs(stock.forecast - 0.5);


function buyLongStock(ns: NS, chosen: string) {
    const price = ns.stock.getAskPrice(chosen);
    const pos = ns.stock.getPosition(chosen);
    const max_shares = ns.stock.getMaxShares(chosen) - Math.max(pos[0], pos[2]);
    const qty = Math.min(max_shares, Math.floor((getPlayerMoney(ns) - COMMISSION) / price));

    const buy_price = ns.stock.buyStock(chosen, qty);
    ns.print('(LONG) Bought each share for: ', buy_price);
    ns.print('');
}

function buyShortStock(ns: NS, chosen: string) {
    const price = ns.stock.getBidPrice(chosen);
    const pos = ns.stock.getPosition(chosen);
    const max_shares = ns.stock.getMaxShares(chosen) - Math.max(pos[0], pos[2]);
    const qty = Math.min(max_shares, Math.floor((getPlayerMoney(ns) - COMMISSION) / price));

    const buy_price = ns.stock.buyShort(chosen, qty);
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

    // check API access
    const err = [];
    if (!ns.stock.hasWSEAccount()) err.push('WSE Account');
    if (!ns.stock.hasTIXAPIAccess()) err.push('TIX API Access');
    if (!ns.stock.has4SData()) err.push('4S Data');
    if (!ns.stock.has4SDataTIXAPI()) err.push('4S Data TIX API');
    if (err.length > 0) {
        ns.print("Please buy ", err.join(', '), " first.");
        return;
    }

    // to check for market update
    const random_stock = 'FSIG';
    let last_price = 0;

    while (true) {
        // wait until stocks change
        while (last_price === ns.stock.getPrice(random_stock)) {
            await ns.sleep(1 * 1000);
        }
        last_price = ns.stock.getPrice(random_stock);

        // get all stock details
        const stocks: Stock4S[] = []
        for (const sym of ns.stock.getSymbols()) {
            stocks.push({
                name: sym,
                // price: ns.stock.getPrice(sym),
                forecast: ns.stock.getForecast(sym),
                volatility: ns.stock.getVolatility(sym),
                position: ns.stock.getPosition(sym),
            })
        }

        // go through existing orders
        for (const stock of stocks) {
            if (stock.position[0] > 0 && stock.forecast < LONG_BOUNDARY) {
                ns.stock.sellStock(stock.name, stock.position[0]);
                stock.position[0] = 0;
            }
            if (stock.position[2] > 0 && stock.forecast > SHORT_BOUNDARY) {
                ns.stock.sellShort(stock.name, stock.position[2]);
                stock.position[2] = 0;
            }
        }

        // check money
        if (getPlayerMoney(ns) < 1e6) continue;

        let best_stock: Stock4S | undefined;
        for (const stock of stocks) {
            // check for boundary conditions first
            if (!(stock.forecast >= LONG_BOUNDARY || stock.forecast <= SHORT_BOUNDARY)) continue;
            // check if all shares are already sold
            if (stock.position[0] + stock.position[2] === ns.stock.getMaxShares(stock.name)) continue;
            // check if there is a prev candidate
            if (!best_stock) {
                best_stock = stock;
                continue;
            }

            // compare forecast and volatility
            const nfs = getNormalizedForecast(stock);
            const nfb = getNormalizedForecast(best_stock);
            if (nfs > nfb || (nfs === nfb && stock.volatility > best_stock.volatility)) {
                best_stock = stock
            }
        }
        if (!best_stock) continue;
                
        // buy
        if (best_stock.forecast > 0.5) {
            buyLongStock(ns, best_stock.name);
        } else {
            buyShortStock(ns, best_stock.name);
        }
    }
}