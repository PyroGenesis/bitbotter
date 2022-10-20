/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	while (true) {
		await ns.weaken(ns.args[0]);
	}
}