/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	// verify that it's already hacked
	let server_name = ns.args[0]
	if (!ns.hasRootAccess(server_name)) {
		ns.print(`You have not hacked ${server_name} yet`);
		return;
	}
	
	// disable logs
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
	ns.clearLog();
	ns.print("Script start");

	// get thresholds
	let server_max_money = ns.getServerMaxMoney(server_name);
	let money_threshold = server_max_money * 0.75;

	while (true) {
		let server_curr_money = ns.getServerMoneyAvailable(server_name);
		ns.print(`Money on ${server_name}: ` +
			 	 `${ns.nFormat(server_curr_money, "$0.000a")}/${ns.nFormat(server_max_money, "$0.000a")} ` +
				 `(${ns.nFormat(server_curr_money / server_max_money, "0.00%")})`);

		if (server_curr_money < money_threshold) {
			// weaken to min before growing
			while (ns.getServerSecurityLevel(server_name) - ns.getServerMinSecurityLevel(server_name) > 0.05) {
				await ns.weaken(server_name);
			}
			await ns.grow(server_name);
		} else if (await ns.hack(server_name) === 0 && ns.getServerSecurityLevel(server_name) > ns.getServerMinSecurityLevel(server_name)) {
			await ns.weaken(server_name);
		}
	}
}