import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for buy_server.js");
	ns.tprint("power     The RAM of the server to buy equal to 2^power (1-20)");
	ns.tprint("suffix    The suffix of the server to buy in the format homeserv-suffix (1-25 or 'all')");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	if (ns.args.length == 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}
	const power = ns.args[0] as number;
	const suffix = ns.args[1] as number | "all";

	if (suffix === 'all') {
		for (let i = 1; i <= 25; i++) {
			if (ns.serverExists(`homeserv-${i}`)) continue;
			ns.purchaseServer(`homeserv-${i}`, Math.pow(2, power));
		}
	} else {
		ns.purchaseServer(`homeserv-${suffix}`, Math.pow(2, power));
	}	
}