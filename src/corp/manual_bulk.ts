import { NS } from "@ns";
import { BOOST_MATERIALS, MATERIAL_RATIOS } from "corp/constants";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for manual_bulk.js");
	ns.tprint("<industry>      Industry to buy for");
	ns.tprint("-h <qty>        Optional. The amount of total Hardware to have after buying. Defaults to 0 (don't buy any)");
	ns.tprint("-r <qty>        Optional. The amount of total Robots to have after buying. Defaults to 0 (don't buy any)");
	ns.tprint("-a <qty>        Optional. The amount of total AI Cores to have after buying. Defaults to 0 (don't buy any)");
	ns.tprint("-e <qty>        Optional. The amount of total Real Estate to have after buying. Defaults to 0 (don't buy any)");
	ns.tprint("-s <storage>    Optional. The amount of total storage to have before buying materials. Defaults to 0 (don't buy any)");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for required arguments
	if (ns.args.length < 3) {
		ns.print("Not enough arguments");
		return;
	}
    const chosen_industry = ns.args[0] as string;

    // Optional args
    let hw = 0;
    let rb = 0;
    let ai = 0;
    let re = 0;
    let storage = 0;

	for (let i = 1; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-h':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the total Hardware after the -h argument");
					ns.tail();
					return;
				}
				hw = ns.args[i+1] as number;
				i++;
				break;

			case '-r':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the total Robots after the -r argument");
					ns.tail();
					return;
				}
				rb = ns.args[i+1] as number;
				i++;
				break;

			case '-a':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the total AI Cores after the -a argument");
					ns.tail();
					return;
				}
				ai = ns.args[i+1] as number;
				i++;
				break;

			case '-e':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the total Real Estate after the -e argument");
					ns.tail();
					return;
				}
				re = ns.args[i+1] as number;
				i++;
				break;

			case '-s':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the total Storage after the -s argument");
					ns.tail();
					return;
				}
				storage = ns.args[i+1] as number;
				i++;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	ns.clearLog();

    if (!MATERIAL_RATIOS[chosen_industry]) {
        ns.print(`Invalid industry: ${chosen_industry}`);
        ns.tail();
        return;
    }

    const division = ns.corporation.getCorporation().divisions.find((div) => div.type === chosen_industry);
    if (!division) {
        ns.print(`Division not found for industry: ${chosen_industry}`);
        ns.tail();
        return;
    }

    // buy storage
    if (storage > 0) {
        for (const city of division.cities) {
            while (ns.corporation.getWarehouse(division.name, city).size < storage) {
                ns.corporation.upgradeWarehouse(division.name, city);
                await ns.sleep(10);
            }
        }
    }

    const final_values = [hw, rb, ai, re];
    // ns.print(division.name, ": ", final_values);

    for (const city of division.cities) {
        for (let j=0; j < BOOST_MATERIALS.length; j++) {
            // skip if this resource not needed
            if (final_values[j] <= 0) continue;
            const current = ns.corporation.getMaterial(division.name, city, BOOST_MATERIALS[j]).qty;
            const to_buy = final_values[j] - current;
            // skip if this resource is satisfied
            if (to_buy <= 0) continue;
            
            ns.print(`Buying ${to_buy} ${BOOST_MATERIALS[j]} for ${division.name} in ${city}`)
            ns.corporation.buyMaterial(division.name, city, BOOST_MATERIALS[j], to_buy / 10);
        }
    }	

	let sleep_for = 5 * 1000;
    const bonus_time = ns.corporation.getBonusTime();
    if (bonus_time > 5000) {
		sleep_for = 1 * 1000
    }
    await ns.sleep(sleep_for);

    for (const city of division.cities) {
        for (const material of BOOST_MATERIALS) {
            ns.corporation.buyMaterial(division.name, city, material, 0);
        }
    }
}