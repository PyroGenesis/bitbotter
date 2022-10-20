import { BOOST_MATERIALS, MATERIAL_SPACE_IDX, CITIES } from "corp/constants";

// const jobs = ["Operations","Engineer","Business","Management","Research & Development"];
// const boost_materials = ["Hardware","Robots","AI Cores","Real Estate"]
// const level_upgrades = ["Smart Factories","Smart Storage","FocusWires","Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants","Wilson Analytics"]
// const cities = ["Aevum","Chongqing","New Tokyo","Ishima","Volhaven","Sector-12"];

/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog();

	const ratios = {
		"Software": [5, 1, 3, 2],
		"Gajara": [4, 5, 5, 14],
		"Just Die": [2, 4, 2, 2],
		"Gourmand": [2, 5, 5, 1],
		"NSHB": [2, 5, 4, 1],
		"Hippocrat": [1, 1, 1, 1],
		"Skynet": [3, 1, 7, 6],
		"Zalmund": [1, 7, 3, 4],
		"Comfo": [1, 11, 11, 1],
		"Rock and Roll": [8, 9, 9, 5],
		"Hawkins National": [1, 1, 5, 13],
		"Rat Maze": [1, 8, 8, 10],
		"Forks": [6, 10, 4, 2],
		"Acidic Industries": [4, 5, 4, 5],
	}

	let divisions = Object.keys(ratios);
	for (let i = 0; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-c':
				if (i+1 > ns.args.length) {
					ns.print("Please specify a company name or multiple separated by comma");
					ns.tail();
					return;
				}
				divisions = ns.args[i+1].split(',');
				i++;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	// division
	for (const division of divisions) {
		// values to end up with
		let space_to_fill = ns.corporation.getWarehouse(division, CITIES[0]).size / 4;
		let space_per_batch = ratios[division].reduce((p, c, i) => {
			// ns.tprint(p, " ", c, " ", i);
			return c * MATERIAL_SPACE_IDX[i] + p;
		}, 0);

		// rounded multiplier (pessimistic)
		let multiplier = Math.floor(space_to_fill / space_per_batch);
		// multiplier reduced to multiple of 10
		multiplier = Math.trunc(multiplier / 10) * 10;
		const final_values = ratios[division].map((val) => val * multiplier);

		ns.print(division, ": ", final_values);

		for (const city of CITIES) {
			for (let j=0; j < BOOST_MATERIALS.length; j++) {
				let current = ns.corporation.getMaterial(division, city, BOOST_MATERIALS[j]).qty;
				let to_buy = final_values[j] - current;
				
				if (to_buy > 0) {
					ns.print(`Buying ${to_buy} ${BOOST_MATERIALS[j]} for ${division} in ${city}`)
					ns.corporation.bulkPurchase(division, city, BOOST_MATERIALS[j], to_buy);
				}
			}
		}
	}
	
}