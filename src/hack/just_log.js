/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}
	let port = ns.getPortHandle(parseInt(ns.args[0]));

	ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");
	ns.tail();

	while (true) {
		if (!port.empty()) {
			ns.print(port.read());
		}
		await ns.sleep(500);
	}
}