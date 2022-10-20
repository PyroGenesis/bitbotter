import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for weaken_once.js");
	ns.tprint("server    Server to hack");
	ns.tprint("id        Unique identifier to be able to run duplicates");
	ns.tprint("port      Optional. Port to out details on");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	if (ns.args.length < 2) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const id = ns.args[1] as string;
	let port = null;
	if (ns.args.length > 2) {
		port = ns.args[2] as number;
	}

	await ns.weaken(server);
	if (port !== null) {
		await ns.writePort(port, `Finished weaken ${id}`);
	}
}