import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for delete_server.js");
	// ns.tprint("power     The RAM of the server to buy equal to 2^power (1-20)");
	// ns.tprint("suffix    The suffix of the server to buy in the format homeserv-suffix (1-25 or 'all')");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// if (ns.args.length == 1 && ns.args[0] === 'help') {
	// 	printArgs(ns);
	// 	return;
	// }
	// const power = ns.args[0] as number;
	// const suffix = ns.args[1] as number | "all";

    const max_ram = Math.pow(2, 20)
    for (let i = 1; i <= 25; i++) {
        if (!ns.serverExists(`homeserv-${i}`)) continue;
        if (ns.getServerMaxRam(`homeserv-${i}`) === max_ram) continue;

        ns.killall(`homeserv-${i}`)
        ns.deleteServer(`homeserv-${i}`)
    }
}