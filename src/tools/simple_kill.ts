import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for simple_kill.js");
	ns.tprint("script    The script to kill");
	ns.tprint("host      Optional. The host to kill on.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	if (ns.args.length == 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		ns.tail();
		return;
	}

	const script = ns.args[0] as string;
	const host = ns.args.length > 1 ? ns.args[1] as string : ns.getHostname();

    ns.scriptKill(script, host);
}