import { NS } from "@ns";
import { nukeServer } from "lib/utils";

const servers = new Set()
let do_all = false;

async function backdoorServer(ns: NS, server: string) {
    if (!ns.hasRootAccess(server)) {
		ns.print(`${server} has not been hacked yet.`);
		return;
	}
    if (ns.getServer(server).backdoorInstalled) {
		ns.print(`${server} has already been backdoored.`);
		return;
    }
    if (ns.getServerMaxMoney(server) > 0 && !do_all) {
		ns.print(`${server} doesn't seem to be important enough to backdoor.`);
		return;
    }

    await ns.singularity.installBackdoor();
	ns.tprint(`Backdoored ${server}!`);
}

/** 
 * @param {NS} ns 
 * @param {string} server
*/
async function recurse(ns: NS, server: string) {
	servers.add(server);

	// try to nuke
	nukeServer(ns, server);
    // try to backdoor
    await backdoorServer(ns, server);

	// populate neighbors for hacking
	const neighbors = ns.scan(server);
	for (const neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

        // connect to the server for backdoor purpose
        ns.singularity.connect(neighbor);
        // nuke and backdoor
		await recurse(ns, neighbor);
        // connect back to parent
        ns.singularity.connect(server);
	}

}

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for nuke_and_backdoor.js");
	ns.tprint("scope    Optional. Whether to hack all servers. Put 'all' to hack all servers.");
	// ns.tprint("port      Port to out details on");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}
	do_all = ns.args.length > 0 && ns.args[0] === "all";

	ns.disableLog("scan");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getServerNumPortsRequired");
	ns.disableLog("brutessh");
	ns.disableLog("ftpcrack");
	ns.disableLog("nuke");
	ns.clearLog();
	ns.print("Script start");

	await recurse(ns, 'home');

	servers.clear();
}