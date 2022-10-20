import { NS } from "@ns";

export interface ServerDetail {
	name: string; 
	max_money: number; 
	max_ram: number; 
	min_security: number;
}

/** 
 *  @param {NS} ns 
 *  @param {string} server
 *  @param {string} script
 *  @param {number | "all"} threads
 *  @param {...(string | number | boolean)} args
*/
export async function copyAndExec(ns: NS, server: string, script: string, threads: number | "all", ...args: (string | number | boolean)[]) {
	if (server === "home" || !ns.hasRootAccess(server)) {
		ns.print(`Don't have root on ${server}`);
		return;
	}

	if (!ns.scp(script, server, "home")) {
		ns.tprint(`Failed to copy ${script} to ${server}`);
		return;
	}

	// threads
	if (threads === "all") {
		threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script, server));
	}

	// run the script
	ns.exec(script, server, threads, ...args);
	ns.tprint(`Ran ${threads} threads on ${server}`);
}

/** 
 * @param {NS} ns
*/
export function getServerList(ns: NS) {
	const servers = new Set();
	const server_list: ServerDetail[] = [];

	/** @param {NS} ns 
	 *  @param {string} server
	*/
	function recurse(ns: NS, server: string) {
		servers.add(server);

		// get all details
		if (server !== "home" && ns.hasRootAccess(server)) {
			server_list.push({
				name: server,
				max_money: ns.getServerMaxMoney(server),
				max_ram: ns.getServerMaxRam(server),
				min_security: ns.getServerMinSecurityLevel(server)
			});
		}

		// populate neighbors for hacking
		const neighbors = ns.scan(server);
		for (const neighbor of neighbors) {
			if (servers.has(neighbor)) continue;

			recurse(ns, neighbor);
		}

	}

	recurse(ns, 'home');
	return server_list;
}