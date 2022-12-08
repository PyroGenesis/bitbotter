import { NS } from "@ns";
import { results_file, Stock } from "/stocks/common";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print('script start')
    ns.tail();

    if (!ns.fileExists(results_file)) {
        ns.print('Results file missing');
        return;
    }

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

    // let p = ns.stock.getPrice(stocks[0].name) - stocks[0] / 
    let stock_peak_percent = 0;
    let stock_trough_percent = Infinity;
    let stock_peak, stock_trough;

    for (const stock of stocks) {
        if (Date.now() - stock.last_update < 30 * 60 * 1000) continue;

        const p = (ns.stock.getPrice(stock.name) - stock.low) / (stock.high - stock.low);

        if (p > stock_peak_percent) {
            stock_peak_percent = p;
            stock_peak = stock;
        }
        if (p < stock_trough_percent) {
            stock_trough_percent = p;
            stock_trough = stock;
        }
    }

    if (stock_peak) ns.print(stock_peak.name);
    if (stock_trough) ns.print(stock_trough.name);
}