/** @param {NS} ns */
export async function main(ns) {

	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");

	// open log
	ns.tail();

	let n = ns.hacknet.numNodes();
	// let ideal_stats = ns.hacknet.getNodeStats(0)
	// ns.tprint(`Upgrading ${n-2} nodes to ${ideal_stats.level} level, ${ideal_stats.ram} ram and ${ideal_stats.cores} cores`);
	
	let total_cost = 0;
	let total_production = 0;		

	// Skip the last node
	for (let i = 0; i < n-1; i++) {
		let cost = 0;
		let stats = ns.hacknet.getNodeStats(i)

		let level_upgrades = stats.level - 1;
		let ram_upgrades = Math.round(Math.log2(stats.ram));
		let core_upgrades = stats.cores - 1;

		cost += ns.hacknet.getLevelUpgradeCost(n-1, level_upgrades);
		cost += ns.hacknet.getRamUpgradeCost(n-1, ram_upgrades);
		cost += ns.hacknet.getCoreUpgradeCost(n-1, core_upgrades);

		total_cost += cost;
		total_production += stats.totalProduction;

		ns.print(`Node ${i}: ${ns.nFormat(stats.totalProduction / cost, "0.00%")}`);
	}

	// add the cost to buy all nodes
	total_cost += ns.hacknet.getPurchaseNodeCost();

	ns.print(" ");
	ns.print(`Total: ${ns.nFormat(total_production / total_cost, "0.00%")}`);	
}