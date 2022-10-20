/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep');
	ns.clearLog();
	ns.tail();

	let last_change = Date.now();
	let min_price = Infinity;
	let max_price = -Infinity;

	while (true) {
		// keep track of old prices
		let old_min = min_price;
		let old_max = max_price;

		// check for a period of 60*500 (30s)
		for (let i = 0; i < 60; i++) {
			let price = ns.corporation.getCorporation().sharePrice;
			let to_log = price < min_price || price > max_price;

			min_price = Math.min(min_price, price);
			max_price = Math.max(max_price, price);

			if (to_log) {
				ns.print(`Min: ${ns.nFormat(min_price, "$0.000a")}, Max: ${ns.nFormat(max_price, "$0.000a")}` +
							` after ${ns.nFormat((Date.now() - last_change) / 1000, "0.0")}`);
				last_change = Date.now();
			}
			await ns.sleep(500);
		}

		// show log if min / max haven't moved
		if (old_min === min_price && old_max === max_price) {
			ns.tail();
		}
	}

	
}