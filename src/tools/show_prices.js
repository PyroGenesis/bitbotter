/** @param {NS} ns */
export async function main(ns) {
	for (let i = 1; i <= 20; i++) {
		ns.tprint(i + " -- " + Math.pow(2, i) + " -- " + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2, i)), "\$0.000a"));
	}
}