import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	// ns.tprint("Arguments needed for manual_bulk.js");
	// ns.tprint("<industry>                      Industry to buy for");
	// ns.tprint("-a <aevum_employees>|<split>    Optional. Number of employees to have at Aevum. You can also provide a split: (Eg: 9|auto OR 9|3,2,2,2,0)");
	// ns.tprint("-o <other_employees>|<split>    Optional. Number of employees to have at other cities. You can also provide a split: (Eg: 9|auto OR 9|3,2,2,2,0)");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// check for required arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}
    const order = parseInt(ns.args[0] as string);
	const limit = Math.pow(10, order);

    const upgrades = ns.corporation.getUpgradeNames();
    for (const upgrade of upgrades) {
        while (ns.corporation.getUpgradeLevelCost(upgrade) < limit) {
            ns.corporation.levelUpgrade(upgrade);
            await ns.sleep(100);
        }
    }
}