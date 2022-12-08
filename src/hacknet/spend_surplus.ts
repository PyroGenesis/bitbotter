import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    while (true) {
        const n = ns.hacknet.numNodes();
        if (n === 0) {
            return;
        }

        const curr_hashes = ns.hacknet.numHashes();
        const max_hashes = ns.hacknet.hashCapacity();
        const money_cost = ns.hacknet.hashCost("Sell for Money");
        const total_prod = ns.hacknet.getNodeStats(0).production * n;

        const c = Math.ceil(total_prod * 5 / money_cost);

        if ((curr_hashes + c*money_cost) > max_hashes) {            
            ns.hacknet.spendHashes("Sell for Money", undefined, c);
        }

        await ns.sleep(5 * 1000);
    }
}