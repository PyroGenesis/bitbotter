import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    const money_sink = ns.hacknet.hashCost("Sell for Money");
    while (true) {
        const curr_hashes = ns.hacknet.numHashes();

        ns.hacknet.spendHashes("Sell for Money", undefined, Math.trunc(curr_hashes / money_sink));
        await ns.sleep(200);
    }
}