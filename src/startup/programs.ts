import { NS } from "@ns";

const startup_script = "/startup/main.js";
const programs_to_buy = [
    {
        name: "BruteSSH.exe",
        cost: 0
    },
    {
        name: "FTPCrack.exe",
        cost: 0
    },
    {
        name: "relaySMTP.exe",
        cost: 0
    },
    {
        name: "HTTPWorm.exe",
        cost: 0
    },
    {
        name: "SQLInject.exe",
        cost: 0
    },
]

/** @param {NS} ns */
function getPlayerMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('singularity.getDarkwebProgramCost');
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print('Script started');

    // calculating costs
    for (const program of programs_to_buy) {
        program.cost = ns.singularity.getDarkwebProgramCost(program.name);
    }

    // sorting by costs
    programs_to_buy.sort((a, b) => a.cost - b.cost);

    // buying one by one
    for (const program of programs_to_buy) {
        // skip 
        if (program.cost < 1) {
            ns.print(`${program.name} skipped`);
            continue;
        }

        // wait until we have atleast twice the money cost
        const wait_cond = () => getPlayerMoney(ns) < program.cost*2
        if (wait_cond()) {
            ns.print(`Waiting for enough money to buy ${program.name}. Needed: ${ns.nFormat(program.cost*2, "$0.00a")}`);
            while (wait_cond()) {
                await ns.sleep(10 * 1000);
            }
        }

        // buy the program        
        ns.singularity.purchaseProgram(program.name);
    }

    ns.tprint("Bought all darkweb programs");
    // ns.spawn(startup_script, 1, ...ns.args);
}