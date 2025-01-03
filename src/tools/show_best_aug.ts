import { AugmentationStats, NS } from "@ns";
import { LogEntries, LogEntry, printClean } from "lib/logging";

class AugTypes {
    // separate skills
    hacking: boolean;
    strength: boolean;
    defense: boolean;
    dexterity: boolean;
    agility: boolean;
    charisma: boolean;

    // groups
    #combat: boolean;
    #all: boolean;

    work: boolean;
    faction: boolean;
    crime: boolean;
    hacknet: boolean;
    bladeburner: boolean;
    // other: boolean;

    constructor() {
        this.hacking = false;
        this.strength = false;
        this.defense = false;
        this.dexterity = false;
        this.agility = false;
        this.charisma = false;

        this.#combat = false;
        this.#all = false;        

        this.work = false;
        this.faction = false;
        this.crime = false;
        this.hacknet = false;
        this.bladeburner = false;
    }

    getArray(): string[] {
        const arr = []

        this.#combat = this.strength && this.defense && this.dexterity && this.agility;
        this.#all = this.#combat && this.hacking && this.charisma;

        if (this.#all) {
            arr.push("all");
        } else if (this.#combat) {
            arr.push("combat");
        }

        if (!this.#all) {
            if (this.hacking) arr.push("hacking");

            if (!this.#combat) {
                if (this.strength) arr.push("strength");
                if (this.defense) arr.push("defense");
                if (this.dexterity) arr.push("dexterity");
                if (this.agility) arr.push("agility");
            }

            if (this.charisma) arr.push("charisma");
        }

        if (this.work) arr.push("work");
        if (this.faction) arr.push("faction");
        if (this.crime) arr.push("crime");
        if (this.hacknet) arr.push("hacknet");
        if (this.bladeburner) arr.push("bladeburner");
        if (arr.length === 0) arr.push("other");
        return arr;
    }
}

interface Aug {
    name: string,
    cost: number,
    faction: string,
}

const extraFormats = [1e15, 1e18, 1e21, 1e24, 1e27, 1e30];
const extraNotations = ["q", "Q", "s", "S", "o", "n"];
function bigNumberFormatter(ns: NS, n: number, prefix = "$", decimals = 2, commas = true): string {
    // build the format string according to the args
    let f = prefix;
    if (commas) {
        f += "0,0";
    } else {
        f += "0"
    }
    if (decimals > 0) f += "." + "0".repeat(decimals);
    f += "a"    

    // define a suffix if the number is too big
    // we will also reduce the number when a custom suffix is defined, 
    //      so that we can apply formatting to the rest of the number
    let suffix = null;
    for (let i = extraFormats.length - 1; i >= 0; i--) {
        if (n > extraFormats[i]) {
            suffix = extraNotations[i];
            n /= extraFormats[i];
            break;
        }
    }

    // use nFormat
    let res = ns.nFormat(n, f);
    // add the suffix if necessary
    if (suffix !== null) {
        // we will replace any non-numeric suffix added by the nFormat and replace it with our own
        const last_char = res[res.length - 1];
        if (last_char >= "0" && last_char <= "9") {
            res += suffix;
        } else {
            res = res.substring(0, res.length - 1) + suffix
        }
    }
    
    // result
    return res;
}

function getAugmentationFocus(stats: AugmentationStats): string {
    const aug_types = new AugTypes();

    if (stats.hacking !== 1 || 
        stats.hacking_chance !== 1 || stats.hacking_speed !== 1 || stats.hacking_money !== 1 || stats.hacking_grow !== 1 || stats.hacking_exp !== 1) {
        aug_types.hacking = true;
    }
    if (stats.strength !== 1 || stats.strength_exp !== 1) {
        aug_types.strength = true;
    }
    if (stats.defense !== 1 || stats.defense_exp !== 1) {
        aug_types.defense = true;
    }
    if (stats.dexterity !== 1 || stats.dexterity_exp !== 1) {
        aug_types.dexterity = true;
    }
    if (stats.agility !== 1 || stats.agility_exp !== 1) {
        aug_types.agility = true;
    }
    if (stats.charisma !== 1 || stats.charisma_exp !== 1) {
        aug_types.charisma = true;
    }
    if (stats.company_rep !== 1 || stats.work_money !== 1) {
        aug_types.work = true;
    }
    if (stats.faction_rep !== 1) {
        aug_types.faction = true;
    }
    if (stats.crime_money !== 1 || stats.crime_success !== 1) {
        aug_types.crime = true;
    }
    if (stats.hacknet_node_money !== 1 || stats.hacknet_node_purchase_cost !== 1 || stats.hacknet_node_ram_cost !== 1 || stats.hacknet_node_core_cost !== 1 || stats.hacknet_node_level_cost !== 1) {
        aug_types.hacknet = true;
    }
    if (stats.bladeburner_max_stamina !== 1 || stats.bladeburner_stamina_gain !== 1 || stats.bladeburner_analysis !== 1 || stats.bladeburner_success_chance !== 1) {
        aug_types.bladeburner = true;
    }

    return aug_types.getArray().join(',');
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
    let multiplier = ns.singularity.getAugmentationPrice(augs[0].name) / ns.singularity.getAugmentationBasePrice(augs[0].name);
    let total_cost = 0;

    const done = new Set<string>();
    const output = new LogEntries();
    
    const heading = new LogEntry();
    heading.values.push('Faction');
    heading.values.push('Name');
    heading.values.push('Cost');
    heading.values.push('Focus');
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
                entry.values.push(bigNumberFormatter(ns, actual_cost));

                const stats = ns.singularity.getAugmentationStats(a.name);
                entry.values.push(getAugmentationFocus(stats));

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
    total.values.push(bigNumberFormatter(ns, total_cost));
    total.values.push('');
    output.addLog(total);

    printClean(ns, output);
}