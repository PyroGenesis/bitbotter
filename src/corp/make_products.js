import { CITIES } from "corp/constants";

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

/** @param {NS} ns */
export async function main(ns) {
	let divisions = ns.corporation.getCorporation().divisions;

	for (const division of divisions) {
		// If this division does not make products, move on to next
		if (!division.makesProducts) continue;

		let max_products = 3;
		if (ns.corporation.hasResearched(division.name, "uPgrade: Capacity.I")) max_products++;
		if (ns.corporation.hasResearched(division.name, "uPgrade: Capacity.II")) max_products++;

		for (let i = division.products.length; i < max_products; i++) {
			let product_name = division.name + " v" + getRandomInt(1, 10000);
			ns.corporation.makeProduct(division.name, "Aevum", product_name, 1e10, 1e10);

			// set the price if we can
			if (ns.corporation.hasResearched(division.name, "uPgrade: Dashboard")) {
				ns.corporation.sellProduct(division.name, "Aevum", product_name, "MAX", "MP", true);

				// set TA2 if we can
				if (ns.corporation.hasResearched(division.name, "Market-TA.II")) {
					ns.corporation.setProductMarketTA2(division.name, product_name, true);
				}
			}
		}

	}
}