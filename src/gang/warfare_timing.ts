import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print('Script start');
    ns.tail();

    let p_o = ns.gang.getGangInformation().power;
    let d_o = new Date();

    while (true) {
        await ns.sleep(200);
        const d_n = new Date();
        const p_n = ns.gang.getGangInformation().power;

        if (p_o !== p_n) {
            ns.print(d_n.toISOString() + " pass " + ( d_n.valueOf() - d_o.valueOf() ) + " ms");
            d_o = d_n;
            p_o = p_n;
        }
    }

}