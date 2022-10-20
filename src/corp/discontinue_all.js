// import { CITIES } from "corp/constants";

/** @param {NS} ns */
export async function main(ns) {
	let divisions = ns.corporation.getCorporation().divisions;

	for (const division of divisions) {
		// If this division does not make products, move on to next
		if (!division.makesProducts) continue;

		for (const product of division.products) {
			ns.corporation.discontinueProduct(division.name, product)
		}
	}
}