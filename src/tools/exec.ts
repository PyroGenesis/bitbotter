import { NS } from "@ns";
import { copyAndExec } from '/lib/utils';

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for exec.js");
	ns.tprint("server     Server to execute on");
	ns.tprint("threads    The number of threads that will used to run the script. Enter 'all' to run the maximum possible amount.");
	ns.tprint("script     The script that will be copied and executed on the server");
	ns.tprint("...args    Any extra args will be passed to the script which will be run.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	if (ns.args.length < 3) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const threads = ns.args[1] as number | "all";
	const script = ns.args[2] as string;

	await copyAndExec(ns, server, script, threads, ...ns.args.slice(3));
}