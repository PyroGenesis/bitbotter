/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}

	// spawn the script
	let script = ns.args[0]
	// if not home, copy the script to be executed from home
	if (ns.getHostname() !== 'home') {
		ns.scp(script, ns.getHostname(), 'home');
	}

	// ns.print(ns.getServer().maxRam, " ", ns.getScriptRam(script))
	// return;
	let max_threads = Math.floor(ns.getServer().maxRam / ns.getScriptRam(script));
	ns.spawn(script, max_threads, ...ns.args.slice(1));
}