let servers = new Set()
let output = []

const NESTING = false;
const WARN = false;
const SORTING = true;

/**
 *  @param {number} level
 */
function getNestingString(level) {
	let str = []
	for (let i=0; i<level; i++) {
		str.push('|')
	}
	return str.join('')
}

/**
 * @param {NS} ns 
 * @param {Object[][]} values
 */
function printClean(ns, values) {
	// let entries = values.length;
	let cols = values[0].length;
	let col_lengths = Array(cols).fill(0);

	let start = 0
	if (SORTING) {
		values.sort((a, b) => b[0] - a[0]);
		start++;
	}


	// calc max col lengths
	for (const entry of values) {
		for (let j = start; j < entry.length; j++) {
			col_lengths[j] = Math.max(col_lengths[j], entry[j].length);
		}
	}

	// print
	for (const entry of values) {
		let print_str = [];
		for (let j = start; j < entry.length; j++) {
			print_str.push(entry[j].padEnd(col_lengths[j] + 1))
		}
		ns.print(print_str.join(''));
	}
}

/** @param {NS} ns 
 *  @param {string} server
 *  @param {number} level
*/
function printMoney(ns, server, level) {
	if (server === "home" || !ns.hasRootAccess(server)) {
		// ns.print(`Don't have root on ${server}`);
		return;
	}
	
	let server_curr_money = ns.getServerMoneyAvailable(server);
	let server_max_money = ns.getServerMaxMoney(server);
	
	let print_str = [];
	if (server_max_money === 0) {
		if (SORTING) print_str.push(0);
		if (WARN) print_str.push("WARN");
		if (NESTING) print_str.push(getNestingString(level));
		print_str.push(`${server}`);	
		print_str.push('$0');	
	} else {
		// ns.print(`${server}: ` +
		// 		 `${ns.nFormat(server_curr_money, "$0.00a")}/${ns.nFormat(server_max_money, "$0.00a")} ` +
		// 		 `(${ns.nFormat(server_curr_money / server_max_money, "0.00%")}) ` +
		// 		 `+${ns.getServerGrowth(server)}`);	
		if (SORTING) print_str.push(server_max_money);
		if (WARN) print_str.push("    ");
		if (NESTING) print_str.push(`${getNestingString(level)}`);
		print_str.push(`${server}`);
		print_str.push(`${ns.nFormat(server_max_money, "$0.00a")}`);
		print_str.push(`+${ns.getServerGrowth(server)}`);	
		print_str.push(ns.nFormat(server_curr_money / server_max_money, "0%"));
	}
	output.push(print_str);
}
	

/** @param {NS} ns 
 *  @param {string} server
 *  @param {number} level
*/
function recurse(ns, server, level) {
	servers.add(server);

	// try to nuke
	printMoney(ns, server, level);

	// populate neighbors for hacking
	let neighbors = ns.scan(server);
	for (let neighbor of neighbors) {
		if (servers.has(neighbor)) continue;

		recurse(ns, neighbor, level+1);
	}

}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("scan");
	ns.disableLog("hasRootAccess");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerGrowth");
	ns.clearLog();
	ns.print("Script start");
	ns.tail();

	recurse(ns, 'home', 0);
	printClean(ns, output);

	servers.clear();
	output = [];
}