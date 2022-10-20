import { CITIES } from "corp/constants";

/** @param {NS} ns */
export async function main(ns) {
	let limit = 0;
	for (let i = 0; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-u':
			case '--undo':
				limit = -1;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	let divisions = ns.corporation.getCorporation().divisions;

	for (const division of divisions) {
		// If this division does not make products, move on to next
		if (!division.makesProducts) continue;

		for (const city of CITIES) {
			for (const product of division.products) {
				ns.corporation.limitProductProduction(division.name, city, product, limit);
			}
		}
	}
}