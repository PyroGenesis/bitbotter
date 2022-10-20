/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 4) {
		ns.print("Not enough arguments");
		return;
	}
	let server = ns.args[0];
	let sleep_time = ns.args[1];
	let id = ns.args[2];
	let port = parseInt(ns.args[3]);

	await ns.sleep(sleep_time);
	let growth = await ns.grow(server);
	ns.writePort(port, `Finished grow ${id}, growth: ${ns.nFormat(growth, "0.00%")}`);
}