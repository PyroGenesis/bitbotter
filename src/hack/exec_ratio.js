/** @param {NS} ns */
export async function main(ns) {
	// check for arguments
	if (ns.args.length < 3) {
		ns.print("Not enough arguments");
		return;
	}
	let exec_server = ns.args[0];
	let target_server = ns.args[1];
	let ratioArr = ns.args[2].split(':');
	
	// disable logs	
	// ns.disableLog("scp");
	// ns.disableLog("killall");
	// ns.disableLog("getServerMaxRam");
	// ns.disableLog("getServerUsedRam");
	// ns.disableLog("getScriptRam");
	// ns.clearLog();
	// ns.print("Script start");

	// copy the files over
	let scripts = ["/hack/just_hack.js", "/hack/just_grow.js", "/hack/just_weaken.js"];
	await ns.scp(scripts, exec_server, "home");

	// kill anything running before
	ns.killall(exec_server, true);

	// calculate max threads
	let max_threads = Math.floor((ns.getServerMaxRam(exec_server) - ns.getServerUsedRam(exec_server)) / ns.getScriptRam(scripts[1], exec_server));

	// ratio calc
	let hack_ratio = parseInt(ratioArr[0]);
	let grow_ratio = parseInt(ratioArr[1]);
	let weaken_ratio = parseInt(ratioArr[2]);
	let total_ratio = hack_ratio + grow_ratio + weaken_ratio;

	// threads per operation
	let hack_threads = Math.round(max_threads * hack_ratio / total_ratio);
	let grow_threads = Math.round(max_threads * grow_ratio / total_ratio);
	let weaken_threads = Math.round(max_threads * weaken_ratio / total_ratio);

	// launch threads
	ns.exec(scripts[0], exec_server, hack_threads, target_server);
	ns.tprint(`Ran ${hack_threads} hack threads on ${exec_server}`);
	ns.exec(scripts[1], exec_server, grow_threads, target_server);
	ns.tprint(`Ran ${grow_threads} grow threads on ${exec_server}`);
	ns.exec(scripts[2], exec_server, weaken_threads, target_server);
	ns.tprint(`Ran ${weaken_threads} weaken threads on ${exec_server}`);
}