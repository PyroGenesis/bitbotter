import { NS } from "@ns";

const startup_script = "/startup/main.js";
const programs_to_buy = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

/** @param {NS} ns */
function getPlayerMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns: NS) {
    let money_needed = 0;
    for (const program of programs_to_buy) {
        money_needed += ns.singularity.getDarkwebProgramCost(program);
    }

    if (getPlayerMoney(ns) < money_needed) {
        ns.tprint(`Waiting for enough money to buy darkweb programs. Needed: ${money_needed}`);
        while (getPlayerMoney(ns) < money_needed) {
            ns.sleep(10 * 1000);
        }
    }

    for (const program of programs_to_buy) {
        ns.singularity.purchaseProgram(program);
    }

    ns.tprint("Bought all darkweb programs");

    // ns.spawn(startup_script, 1, ...ns.args);
}