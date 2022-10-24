import { NS } from "@ns";
import { nukeServer } from "lib/utils";

const servers = new Set()

/** 
 * @param {NS} ns 
 * @param {string} server
*/
function recurse(ns: NS, server: string) {
	servers.add(server);

	// try to nuke
	nukeServer(ns, server);

	// populate neighbors for hacking
	const neighbors = ns.scan(server);
	for (const neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

		recurse(ns, neighbor);
	}

}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("scan");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getServerNumPortsRequired");
	ns.disableLog("brutessh");
	ns.disableLog("ftpcrack");
	ns.disableLog("nuke");
	ns.clearLog();
	ns.print("Script start");

	recurse(ns, 'home');

	servers.clear();
}