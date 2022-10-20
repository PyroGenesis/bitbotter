let servers = new Set()

/** @param {NS} ns 
 *  @param {string} server
*/
function printRam(ns, server) {
	if (server === "home" || !ns.hasRootAccess(server)) {
		// ns.print(`Don't have root on ${server}`);
		return;
	}
	
	let server_used_ram = ns.getServerUsedRam(server);
	let server_max_ram = ns.getServerMaxRam(server);
	
	ns.print(`${server}: ` +
			 `${server_used_ram}/${server_max_ram} ` +
			 `(${(100.0 * server_used_ram / server_max_ram).toFixed(2)}%)`);
}

/** @param {NS} ns 
 *  @param {string} server
*/
function recurse(ns, server) {
	servers.add(server);

	// try to nuke
	printRam(ns, server);

	// populate neighbors for hacking
	let neighbors = ns.scan(server);
	for (let neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

		recurse(ns, neighbor);
	}

}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("scan");
	ns.disableLog("hasRootAccess");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerGrowth");
	ns.clearLog();
	ns.print("Script start");
	ns.tail();

	recurse(ns, 'home');

	servers.clear();
}