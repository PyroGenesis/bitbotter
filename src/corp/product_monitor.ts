import { NS, Product } from "@ns";

function getRandomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function getProductScore(p: Product): number {
	if (p.cmp && p.dmd) {
		const r = p.rat / 10000;
		const d = p.dmd / 100;
		return Math.pow(r, 4)*d / p.cmp
	} else {
		return p.rat
	}
}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog('sleep');
	ns.clearLog();
	ns.print('Script start');
	ns.tail();

	while (true) {
		// get divisions
		const divisions = ns.corporation.getCorporation().divisions;
	
		for (const division of divisions) {
			// If this division does not make products, move on to next
			if (!division.makesProducts) continue;
	
			let max_products = 3;
			if (ns.corporation.hasResearched(division.name, "uPgrade: Capacity.I")) max_products++;
			if (ns.corporation.hasResearched(division.name, "uPgrade: Capacity.II")) max_products++;
	
			// only find something to discontinue if we are at max products
			if (division.products.length === max_products) {
				let in_development = false;
				let worst_product = null;
				let worst_score = Infinity;

				// find the worst product to discontinue
				for (const product of division.products) {
					const p = ns.corporation.getProduct(division.name, product)
					if (p.developmentProgress < 100) {
						// There's still a product in developement here, we skip this division
						in_development = true;
						break;
					}
					const score = getProductScore(p)
					if (score < worst_score) {
						worst_score = score;
						worst_product = product;
					}

					// ns.print(p.name);
					// ns.print(`p.rat: ${p.rat}`);
					// ns.print(`p.cmp: ${p.cmp}`);
					// ns.print(`p.custom1: ${ns.nFormat(getProductScore(p), '0.00a')}`);
					// ns.print(' ')
				}
				// ns.print(`Next choice: ${worst_product}`);
				// return;

				// skip if in development
				if (in_development) continue;
				// discontinue the worst
				if (worst_product !== null) {
					ns.corporation.discontinueProduct(division.name, worst_product);
					ns.print(`Discontinued ${worst_product}`);
				}
			}

			const product_name = division.name + " v" + getRandomInt(1, 10000);
			ns.corporation.makeProduct(division.name, "Aevum", product_name, 1e10, 1e10);
			ns.print(`Developing product ${product_name}`);

			// set the price if we can
			if (ns.corporation.hasResearched(division.name, "uPgrade: Dashboard")) {
				ns.corporation.sellProduct(division.name, "Aevum", product_name, "MAX", "MP", true);

				// set TA2 if we can
				if (ns.corporation.hasResearched(division.name, "Market-TA.II")) {
					ns.corporation.setProductMarketTA2(division.name, product_name, true);
				}
			}	
		}

		// wait a little before next iteration
		await ns.sleep(5000);
	}
}