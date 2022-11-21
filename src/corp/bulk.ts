import { NS } from "@ns";
import { BOOST_MATERIALS, MATERIAL_RATIOS, MATERIAL_SPACE_IDX, CITIES } from "corp/constants";

// const jobs = ["Operations","Engineer","Business","Management","Research & Development"];
// const boost_materials = ["Hardware","Robots","AI Cores","Real Estate"]
// const level_upgrades = ["Smart Factories","Smart Storage","FocusWires","Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants","Wilson Analytics"]
// const cities = ["Aevum","Chongqing","New Tokyo","Ishima","Volhaven","Sector-12"];

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.clearLog();

	let industries = Object.keys(MATERIAL_RATIOS);
	for (let i = 0; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-i':
				if (i+1 > ns.args.length) {
					ns.print("Please specify an industry name or multiple separated by comma");
					ns.tail();
					return;
				}
				industries = (ns.args[i+1] as string).split(',');
				i++;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	// division
	for (const industry of industries) {
		// get division from industry (not that efficient, but ok)
		const division = ns.corporation.getCorporation().divisions.find((d) => d.type === industry);
		if (!division) {
			continue;
		}

		// values to end up with
		const space_to_fill = ns.corporation.getWarehouse(division.name, division.cities[0]).size / 4;
		const space_per_batch = MATERIAL_RATIOS[division.type].reduce((p, c, i) => {
			// ns.tprint(p, " ", c, " ", i);
			return c * MATERIAL_SPACE_IDX[i] + p;
		}, 0);

		// rounded multiplier (pessimistic)
		let multiplier = Math.floor(space_to_fill / space_per_batch);
		// multiplier reduced to multiple of 10
		multiplier = Math.trunc(multiplier / 10) * 10;
		const final_values = MATERIAL_RATIOS[division.type].map((val) => val * multiplier);

		ns.print(division.name, ": ", final_values);

		for (const city of division.cities) {
			for (let j=0; j < BOOST_MATERIALS.length; j++) {
				const current = ns.corporation.getMaterial(division.name, city, BOOST_MATERIALS[j]).qty;
				const to_buy = final_values[j] - current;
				
				if (to_buy > 0) {
					ns.print(`Buying ${to_buy} ${BOOST_MATERIALS[j]} for ${division.name} in ${city}`)
					ns.corporation.bulkPurchase(division.name, city, BOOST_MATERIALS[j], to_buy);
				}
			}
		}
	}
	
}