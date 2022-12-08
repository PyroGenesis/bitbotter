import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	while (true) {
		await ns.weaken(ns.args[0] as string, {stock: true});
	}
}