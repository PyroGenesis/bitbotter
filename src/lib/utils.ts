import { NS } from "@ns";

export interface ServerDetail {
	name: string; 
	max_money: number; 
	max_ram: number; 
	min_security: number;
}

/** @param {NS} ns */
export function getPlayerMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

/** 
 *  @param {NS} ns 
 *  @param {string} server
 *  @param {string} script
 *  @param {number | "all"} threads
 *  @param {...(string | number | boolean)} args
*/
export async function copyAndExec(ns: NS, server: string, script: string, threads: number | "all", ...args: (string | number | boolean)[]) {
	if (server === "home") {
		ns.print('Use spawner.js instead');
		ns.tail();
		return;
	}

	if (!ns.hasRootAccess(server)) {
		ns.print(`Don't have root on ${server}`);
		ns.tail();
		return;
	}

	if (!ns.scp(script, server, "home")) {
		ns.print(`Failed to copy ${script} to ${server}`);
		ns.tail();
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

/** 
 * @param {NS} ns 
 * @param {string} server
*/
export function nukeServer(ns: NS, server: string) {
	if (ns.hasRootAccess(server)) {
		ns.print(`Already have root on ${server}`);
		return;
	}
	if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) {
		ns.print(`Too hard to hack ${server} ` + 
					`(${ns.getHackingLevel()} / ${ns.getServerRequiredHackingLevel(server)})`);
		return;
	}

	let ports_required = ns.getServerNumPortsRequired(server);	

	// Brute SSH if necessary
	if (ports_required > 0 && ns.fileExists("BruteSSH.exe", "home")) {
		ns.brutessh(server);
		ports_required -= 1;			
	}
	// Crack FTP if necessary
	if (ports_required > 0 && ns.fileExists("FTPCrack.exe", "home")) {
		ns.ftpcrack(server);
		ports_required -= 1;			
	}
	// Relay SMTP if necessary
	if (ports_required > 0 && ns.fileExists("relaySMTP.exe", "home")) {
		ns.relaysmtp(server);
		ports_required -= 1;			
	}
	// Worm HTTP if necessary
	if (ports_required > 0 && ns.fileExists("HTTPWorm.exe", "home")) {
		ns.httpworm(server);
		ports_required -= 1;			
	}
	// Inject SQL if necessary
	if (ports_required > 0 && ns.fileExists("SQLInject.exe", "home")) {
		ns.sqlinject(server);
		ports_required -= 1;			
	}

	// is nuke possible?
	if (ports_required > 0) {
		ns.print(`More ports required for server ${server}`);
		return;
	}

	// nuke
	ns.nuke(server);
	ns.print(`Nuked ${server}!`);
	ns.tprint(`Nuked ${server}!`);
}