/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}
	let server = ns.args[0];

	ns.disableLog("scan");
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerGrowth");
	ns.clearLog();
	ns.print("Script start");

	let server_max_money = ns.getServerMaxMoney(server);
	while (true) {
		let server_curr_money = ns.getServerMoneyAvailable(server);
		
		ns.print(`${server}: ` +
			 	`${ns.nFormat(server_curr_money, "$0.00a")}/${ns.nFormat(server_max_money, "$0.00a")} ` +
				`(${ns.nFormat(server_curr_money / server_max_money, "0.00%")})` +
				`+${ns.getServerGrowth(server)}`);

		await ns.sleep(1 * 1000);
	}
}