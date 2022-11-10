import { NS } from "@ns";

const startup_script = "/startup/main.js";

/** @param {NS} ns */
function getPlayerMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns: NS) {
    const money_needed = 200000;
    
    if (getPlayerMoney(ns) < money_needed) {
        ns.tprint("Waiting for enough money to buy TOR router");
        while (getPlayerMoney(ns) < money_needed) {
            ns.sleep(10 * 1000);
        }
    }

    ns.singularity.purchaseTor();

    ns.tprint("Bought the TOR router");

    ns.spawn(startup_script, 1, ...ns.args);
}