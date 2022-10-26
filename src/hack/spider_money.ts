import { NS } from "@ns";
import { LogEntry, LogEntries, printClean } from "lib/logging";

const servers = new Set()
let output: LogEntries = new LogEntries();

// const NESTING = false;
// const WARN = false;
// const SORTING = true;

/**
 *  @param {number} level
 */
function getNestingString(level: number) {
	const str = []
	for (let i=0; i<level; i++) {
		str.push('|')
	}
	return str.join('')
}

/** 
 * @param {NS} ns 
 * @param {string} server
 * @param {number} level
*/
function printMoney(ns: NS, server: string, level: number) {
	if (server === "home" || !ns.hasRootAccess(server)) {
		// ns.print(`Don't have root on ${server}`);
		return;
	}
	
	const server_curr_money = ns.getServerMoneyAvailable(server);
	const server_max_money = ns.getServerMaxMoney(server);
	
	const log_entry = new LogEntry()

	if (server_max_money === 0) {
		log_entry.sort_field = 0
		// if (SORTING) print_str.push(0);
		// if (WARN) print_str.push("WARN");
		// if (NESTING) print_str.push(getNestingString(level));
		log_entry.values.push(`${server}`);	
		log_entry.values.push('$0');	
	} else {
		// ns.print(`${server}: ` +
		// 		 `${ns.nFormat(server_curr_money, "$0.00a")}/${ns.nFormat(server_max_money, "$0.00a")} ` +
		// 		 `(${ns.nFormat(server_curr_money / server_max_money, "0.00%")}) ` +
		// 		 `+${ns.getServerGrowth(server)}`);	
		log_entry.sort_field = server_max_money;
		// if (SORTING) print_str.push(server_max_money);
		// if (WARN) print_str.push("    ");
		// if (NESTING) print_str.push(`${getNestingString(level)}`);
		log_entry.values.push(`${server}`);
		log_entry.values.push(`${ns.nFormat(server_max_money, "$0.00a")}`);
		log_entry.values.push(`+${ns.getServerGrowth(server)}`);	
		log_entry.values.push(ns.nFormat(server_curr_money / server_max_money, "0%"));
	}
	output.addLog(log_entry);
}
	

/** 
 * @param {NS} ns 
 * @param {string} server
 * @param {number} level
*/
function recurse(ns: NS, server: string, level: number) {
	servers.add(server);

	// try to nuke
	printMoney(ns, server, level);

	// populate neighbors for hacking
	const neighbors = ns.scan(server);
	for (const neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

		recurse(ns, neighbor, level+1);
	}

}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("scan");
	ns.disableLog("hasRootAccess");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerGrowth");
	ns.clearLog();
	ns.print("Script start");
	ns.tail();

	output.to_sort = true;
	recurse(ns, 'home', 0);
	printClean(ns, output);

	servers.clear();
	output = new LogEntries();
}