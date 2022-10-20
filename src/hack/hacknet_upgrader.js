/** @param {NS} ns */
function getPlayerMoney(ns) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");

	let limit = parseInt(ns.args[0]);
	let n = ns.hacknet.numNodes();
	ns.print(`Upgrading ${n-1} nodes with a limit of ${limit}`);
	

	while (true) {
		let best_cost = Infinity;
		let best_node = null;

		// skip last node
		for (let i = 0; i < n-1; i++) {
			let upgrade_cost = ns.hacknet.getLevelUpgradeCost(i, 1);
			// node upgrade should be less than limit and the best found yet
			if (upgrade_cost < limit && upgrade_cost < best_cost) {
				best_cost = upgrade_cost;
				best_node = i;
			}
		}

		// if all nodes are above limit
		if (best_node === null) {
			ns.print(`All node upgrades are above limit`);
			return;
		}

		// wait until enough money
		while (best_cost > getPlayerMoney(ns)) {
			ns.print(`Current: ${getPlayerMoney(ns).toLocaleString()}, Needed: ${best_cost.toLocaleString()}`)
			await ns.sleep(5 * 1000);
		}

		// upgrade
		ns.hacknet.upgradeLevel(best_node, 1);
		ns.print(`Upgraded node ${best_node}`);
	}
	
}