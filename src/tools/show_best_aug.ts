import { NS } from "@ns";
import { LogEntries, LogEntry, printClean } from "/lib/logging";

interface Aug {
    name: string,
    cost: number,
    faction: string,
}

/** 
 * @param {NS} ns 
*/
// function printArgs(ns: NS) {
// 	ns.tprint("Arguments needed for simple_kill.js");
// 	ns.tprint("script    The script to kill");
// 	ns.tprint("host      Optional. The host to kill on.");
// }

/** @param {NS} ns */
export async function main(ns: NS) {
	// if (ns.args.length == 1 && ns.args[0] === 'help') {
	// 	printArgs(ns);
	// 	return;
	// }
	// // check for arguments
	// if (ns.args.length < 1) {
	// 	ns.print("Not enough arguments");
	// 	ns.tail();
	// 	return;
	// }
    ns.clearLog();
    ns.tail();

    const owned = ns.singularity.getOwnedAugmentations(true);
    const augs: Aug[] = []
    const unique = new Set<string>();

	for (const faction of ns.getPlayer().factions) {
        for (const aug of ns.singularity.getAugmentationsFromFaction(faction)) {
            if (aug === 'NeuroFlux Governor') continue;
            if (unique.has(aug)) continue;
            if (ns.singularity.getFactionRep(faction) < ns.singularity.getAugmentationRepReq(aug)) continue;
            if (owned.includes(aug)) continue;

            augs.push({
                name: aug,
                cost: ns.singularity.getAugmentationBasePrice(aug),
                faction: faction
            });
            unique.add(aug);
        }
    }

    augs.sort((a, b) => b.cost - a.cost);
    let multiplier = 1;
    let total_cost = 0;

    const done = new Set<string>();
    const output = new LogEntries();
    
    const heading = new LogEntry();
    heading.values.push('Faction');
    heading.values.push('Name');
    heading.values.push('Cost');
    output.addLog(heading);
    
    for (const aug of augs) {
        if (done.has(aug.name)) continue;
        const stack = [aug]

        while (stack.length > 0) {
            const a = stack.pop() as Aug;
            if (done.has(a.name)) continue;

            const prereqs: Aug[] = []
            let prereqs_satisfied = true;
            for (const r of ns.singularity.getAugmentationPrereq(a.name)) {
                if (owned.includes(r) || done.has(r)) continue;
                const prereq = augs.find((aa) => aa.name === r);
                if (!prereq) {
                    prereqs_satisfied = false;
                    break;
                } else {
                    prereqs.push(prereq);
                }
            }
            if (!prereqs_satisfied) break;

            if (prereqs.length === 0) {
                const actual_cost = a.cost * multiplier
                const entry = new LogEntry();
                entry.values.push(a.faction);
                entry.values.push(a.name);
                entry.values.push(ns.nFormat(actual_cost, "$0.00a"));
                output.addLog(entry);

                total_cost += actual_cost
                multiplier *= 1.9;
                done.add(a.name);
            } else {                
                stack.push(a);
                prereqs.sort((p1, p2) => p1.cost - p2.cost);
                stack.push(...prereqs);
            }
        }
    }

    const total = new LogEntry();
    total.values.push('');
    total.values.push('TOTAL:');
    total.values.push(ns.nFormat(total_cost, "$0.00a"));
    output.addLog(total);

    printClean(ns, output);
}