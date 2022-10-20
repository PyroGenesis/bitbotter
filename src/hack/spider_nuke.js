let servers = new Set()

/** @param {NS} ns 
 *  @param {string} server
*/
function nuker(ns, server) {
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

/** @param {NS} ns 
 *  @param {string} server
*/
function recurse(ns, server) {
	servers.add(server);

	// try to nuke
	nuker(ns, server);

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