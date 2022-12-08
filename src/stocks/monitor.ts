import { NS } from "@ns";
import { results_file, Stock } from "/stocks/common";
import { LogEntries, LogEntry, printClean } from "/lib/logging";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print('script start')
    ns.tail();

    const stocks: Stock[] = []
    if (ns.fileExists(results_file)) {
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

    } else {
        for (const sym of ns.stock.getSymbols()) {
            stocks.push({
                name: sym,
                low: Infinity,
                high: 0,
                last_update: Date.now()
            });
        }
    }

    while (true) {
        // update
        for (const stock of stocks) {
            const price = ns.stock.getPrice(stock.name);

            if (price < stock.low || price > stock.high) {
                stock.low = Math.min(stock.low, price);
                stock.high = Math.max(stock.high, price);
                stock.last_update = Date.now();
            }
        }

        // print
        const output = new LogEntries();
        const csv_rows = []

        const heading = new LogEntry();
        heading.values.push('Stock');
        heading.values.push('Low');
        heading.values.push('High');
        heading.values.push('Current');
        heading.values.push('Last Update');
        output.addLog(heading);

        for (const stock of stocks) {
            const entry = new LogEntry();
            entry.values.push(stock.name);
            entry.values.push(ns.nFormat(stock.low, "$0.00a"));
            entry.values.push(ns.nFormat(stock.high, "$0.00a"));
            entry.values.push(ns.nFormat(ns.stock.getPrice(stock.name), "$0.00a"));
            entry.values.push(ns.tFormat(Date.now() - stock.last_update) + ' ago');

            csv_rows.push([
                stock.name,
                stock.low,
                stock.high,
                stock.last_update
            ].join(','))
            output.addLog(entry);
        }

        ns.clearLog();
        printClean(ns, output);
        ns.write(results_file, csv_rows.join('\r\n'), 'w');
        await ns.sleep(1000);
    }
}