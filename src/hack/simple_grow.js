/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");
	ns.clearLog()
	ns.print("Script start")

	let server = ns.args[0];
	let server_max_money = ns.getServerMaxMoney(server);
	let money_threshold = server_max_money * 0.9;

	while (ns.getServerMoneyAvailable(server) < money_threshold) {
		let server_curr_money = ns.getServerMoneyAvailable(server);
		ns.print(`Money on ${server}: ` +
				 `${Math.trunc(server_curr_money).toLocaleString()}/${server_max_money.toLocaleString()} ` +
				 `(${(100.0 * server_curr_money / server_max_money).toFixed(2)}%)`);
		await ns.grow(server);
		ns.print("");
	}	
}