import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	// check for arguments
	if (ns.args.length < 4) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const weaken_time = ns.args[1] as number;
	const id = ns.args[2] as number;
    const total = ns.args[3] as number;
	// const port = ns.args[3] as number;

    const sleep_time = (id / total) * weaken_time;
	if (sleep_time > 0)	await ns.sleep(sleep_time);

	while (true) {
        await ns.weaken(server);
        // ns.writePort(port, `Finished weaken ${id}`);
    }
}