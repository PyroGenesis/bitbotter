import { NS } from "@ns";
import { LogEntry, LogEntries, printClean } from "lib/logging";

const servers = new Set()
let output: LogEntries = new LogEntries();

/** @param {NS} ns 
 *  @param {string} server
*/
function printRam(ns: NS, server: string) {
	if (server === "home" || !ns.hasRootAccess(server)) {
		// ns.print(`Don't have root on ${server}`);
		return;
	}
	
	const server_used_ram = ns.getServerUsedRam(server);
	const server_max_ram = ns.getServerMaxRam(server);
	
	const log_entry = new LogEntry();
	log_entry.sort_field = server_max_ram;

	log_entry.values.push(server);
	log_entry.values.push(ns.nFormat(server_max_ram * 1e9, "0.00b"));
	if (server_max_ram > 0) {
		log_entry.values.push(ns.nFormat(server_used_ram / server_max_ram, "0%"));
	} else {
		log_entry.values.push("0%");
	}
	
	
	output.addLog(log_entry);
}

/** @param {NS} ns 
 *  @param {string} server
*/
function recurse(ns: NS, server: string) {
	servers.add(server);

	// try to nuke
	printRam(ns, server);

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
	ns.disableLog("hasRootAccess");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerGrowth");
	ns.clearLog();
	ns.print("Script start");
	ns.tail();

	output.to_sort = true;
	recurse(ns, 'home');
	printClean(ns, output);

	servers.clear();
	output = new LogEntries();
}