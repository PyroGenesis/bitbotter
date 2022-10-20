let servers = new Set()

/** @param {NS} ns 
 *  @param {string} server
*/
async function wipe(ns, server) {
	if (!ns.hasRootAccess(server)) {
		ns.print(`Don't have root on ${server}`);
		return;
	}

	ns.killall(server, true);
}

/** @param {NS} ns 
 *  @param {string} server
*/
async function recurse(ns, server) {
	//ns.print(servers);
	servers.add(server);

	// run hacker
	await wipe(ns, server);

	// populate neighbors for hacking
	let neighbors = ns.scan(server);
	for (let neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

		await recurse(ns, neighbor);
	}

}

/** @param {NS} ns */
export async function main(ns) {
	await recurse(ns, "home");
	servers.clear();
}