/** @param {NS} ns */
function getPlayerMoney(ns) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns) {
	// // check for arguments
	// if (ns.args.length < 1) {
	// 	ns.print("Not enough arguments");
	// 	return;
	// }

	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	ns.clearLog();
	ns.tail();
	ns.print("Script start");

	// let limit = parseInt(ns.args[0]);
	let n = ns.hacknet.numNodes();
	let ideal_stats = ns.hacknet.getNodeStats(0)
	ns.tprint(`Upgrading ${n-2} nodes to ${ideal_stats.level} level, ${ideal_stats.ram} ram and ${ideal_stats.cores} cores`);
	

	while (true) {
		let best_level_cost = Infinity;
		let best_ram_cost = Infinity;
		let best_cores_cost = Infinity;

		let best_level_node = null;
		let best_ram_node = null;
		let best_cores_node = null;

		// skip first and last nodes
		for (let i = 1; i < n-1; i++) {
			let stats = ns.hacknet.getNodeStats(i)
			let level_cost = ns.hacknet.getLevelUpgradeCost(i, 1)
			let ram_cost = ns.hacknet.getRamUpgradeCost(i, 1);
			let cores_cost = ns.hacknet.getCoreUpgradeCost(i, 1);

			if (stats.level < ideal_stats.level && level_cost < best_level_cost) {
				best_level_cost = level_cost;
				best_level_node = i;
			}
			if (stats.ram < ideal_stats.ram && ram_cost < best_ram_cost) {
				best_ram_cost = ram_cost;
				best_ram_node = i;
			}
			if (stats.cores < ideal_stats.cores && cores_cost < best_cores_cost) {
				best_cores_cost = cores_cost;
				best_cores_node = i;
			}
		}

		// if all nodes are above limit
		if (best_level_node === null && best_ram_node === null && best_cores_node === null) {
			ns.print(`All node upgrades are above limits`);
			return;
		}

		if (best_level_node !== null) {
			// wait until enough money
			while (best_level_cost > getPlayerMoney(ns)) {
				ns.print(`Current: ${getPlayerMoney(ns).toLocaleString()}, Needed: ${best_level_cost.toLocaleString()}`)
				await ns.sleep(2 * 1000);
			}
			// upgrade
			ns.hacknet.upgradeLevel(best_level_node, 1);
			ns.print(`Upgraded node level ${best_level_node}`);

		} else if (best_ram_node !== null) {
			// wait until enough money
			while (best_ram_cost > getPlayerMoney(ns)) {
				ns.print(`Current: ${getPlayerMoney(ns).toLocaleString()}, Needed: ${best_ram_cost.toLocaleString()}`)
				await ns.sleep(2 * 1000);
			}
			// upgrade
			ns.hacknet.upgradeRam(best_ram_node, 1);
			ns.print(`Upgraded node ram ${best_ram_node}`);

		} else if (best_cores_node !== null) {
			// wait until enough money
			while (best_cores_cost > getPlayerMoney(ns)) {
				ns.print(`Current: ${getPlayerMoney(ns).toLocaleString()}, Needed: ${best_cores_cost.toLocaleString()}`)
				await ns.sleep(2 * 1000);
			}
			// upgrade
			ns.hacknet.upgradeCore(best_cores_node, 1);
			ns.print(`Upgraded node cores ${best_cores_node}`);
		}

	}
	
}