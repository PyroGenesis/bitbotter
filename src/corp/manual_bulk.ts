import { NS } from "@ns";
import { BOOST_MATERIALS, MATERIAL_RATIOS, MATERIAL_SPACE_IDX, CITIES } from "corp/constants";

// const jobs = ["Operations","Engineer","Business","Management","Research & Development"];
// const boost_materials = ["Hardware","Robots","AI Cores","Real Estate"]
// const level_upgrades = ["Smart Factories","Smart Storage","FocusWires","Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants","Wilson Analytics"]
// const cities = ["Aevum","Chongqing","New Tokyo","Ishima","Volhaven","Sector-12"];

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.clearLog();

	// let divisions = Object.keys(ratios);
	// for (let i = 0; i < ns.args.length; i++) {
	// 	switch(ns.args[i]) {
	// 		case '-c':
	// 			if (i+1 > ns.args.length) {
	// 				ns.print("Please specify a company name or multiple separated by comma");
	// 				ns.tail();
	// 				return;
	// 			}
	// 			divisions = (ns.args[i+1] as string).split(',');
	// 			i++;
	// 			break;
			
	// 		default:
	// 			ns.print("Invalid argument " + ns.args[i]);
	// 			ns.tail();
	// 			break;
	// 	}
	// }

    const bonus_time = ns.corporation.getBonusTime();
    if (bonus_time > 5000) {
        ns.print("Must wait for bonus time to finish: ", ns.tFormat(bonus_time));
        ns.tail();
        return;
    }

    const chosen_industry = "Tobacco";
    if (!MATERIAL_RATIOS[chosen_industry]) {
        ns.print(`Invalid industry: ${chosen_industry}`);
        ns.tail();
        return;
    }

    const space_to_fill = 1800;
    const division = ns.corporation.getCorporation().divisions.find((div) => div.type === chosen_industry);
    if (!division) {
        ns.print(`Division not found for industry: ${chosen_industry}`);
        ns.tail();
        return;
    }

    // values to end up with
    // const space_to_fill = ns.corporation.getWarehouse(division, CITIES[0]).size / 4;
    const space_per_batch = MATERIAL_RATIOS[chosen_industry].reduce((prev, curr, i) => {
        // ns.tprint(p, " ", c, " ", i);
        return curr * MATERIAL_SPACE_IDX[i] + prev;
    }, 0);

    // rounded multiplier (pessimistic)
    const multiplier = Math.floor(space_to_fill / space_per_batch);
    // multiplier reduced to multiple of 10
    // multiplier = Math.trunc(multiplier / 10) * 10;
    const final_values = MATERIAL_RATIOS[chosen_industry].map((val) => val * multiplier);

    ns.print(division.name, ": ", final_values);

    for (const city of CITIES) {
        for (let j=0; j < BOOST_MATERIALS.length; j++) {
            const current = ns.corporation.getMaterial(division.name, city, BOOST_MATERIALS[j]).qty;
            const to_buy = final_values[j] - current;
            
            if (to_buy > 0) {
                ns.print(`Buying ${to_buy} ${BOOST_MATERIALS[j]} for ${division.name} in ${city}`)
                ns.corporation.buyMaterial(division.name, city, BOOST_MATERIALS[j], to_buy / 10);
            }
        }
    }	

    await ns.sleep(5 * 1000);

    for (const city of CITIES) {
        for (const material of BOOST_MATERIALS) {
            ns.corporation.buyMaterial(division.name, city, material, 0);
        }
    }
}