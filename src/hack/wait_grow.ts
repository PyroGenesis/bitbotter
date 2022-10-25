import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	// check for arguments
	if (ns.args.length < 4) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const sleep_time = ns.args[1] as number;
	const id = ns.args[2];
	const port = ns.args[3] as number;

	if (sleep_time > 0)	await ns.sleep(sleep_time);
	const growth = await ns.grow(server);
	ns.writePort(port, `Finished grow ${id}, growth: ${ns.nFormat(growth, "0.00%")}`);
}