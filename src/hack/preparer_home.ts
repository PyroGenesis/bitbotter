import { NS } from "@ns";
import { getServerList } from 'lib/utils';

// const batcher_script = "/hack/batcher.js";
// const dispatch_script = "/hack/dispatcher.js";
// const hack_script = "/hack/hack_once.js";
const grow_script = "/hack/wait_grow.js";
const weaken_script = "/hack/wait_weaken.js";

// const JOB_SPACER = 500;
// const BATCH_SPACER = 500;
const GROW_PER_WEAKEN = 12;

/** 
 * @param {NS} ns 
*/
function getServerAvailableRam(ns: NS) {
	return ns.getServer().maxRam - ns.getServer().ramUsed;
}

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("No arguments needed for preparer_home.js");
	// ns.tprint("server    Server to hack");
	// ns.tprint("port      Port to out details on");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	// if (ns.args.length < 1) {
	// 	ns.tprint("Not enough arguments");
	// 	return;
	// }
	// let server = ns.args[0];
	// let port = parseInt(ns.args[1]);
	const host_server = ns.getHostname();
	
	// disable default logs
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("scp");
	ns.disableLog("killall");
	ns.disableLog("sleep");
	ns.disableLog("exec");
	ns.disableLog("getHackingLevel");
	ns.clearLog();
	ns.print("Script start");

	// kill anything running before
	// ns.killall(host_server, true);

	// unique identifier for each batch
	let id = 0;

	// do all servers, but give priority to server with more money
    const server_list = getServerList(ns);
    server_list.sort((a, b) => b.max_money - a.max_money);

	for (const server of server_list) {
		// let min_security = ns.getServerMinSecurityLevel(server.name);
		// let max_money = ns.getServerMaxMoney(server.name);

		const weaken_time = ns.getWeakenTime(server.name);
		let finish_at = weaken_time;

		// weaken first
		if (ns.getServerSecurityLevel(server.name) > server.min_security) {
			// threads needed to attain min security
			let weak_threads_needed = Math.ceil((ns.getServerSecurityLevel(server.name) - server.min_security) / 0.05);
			// threads we can make currently
			let weak_threads_possible_curr = Math.floor(getServerAvailableRam(ns) / 1.75);
			// threads we can make in ideal scenario (only this script running)
			const weak_threads_possible_max = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / 1.75);
			// let weak_threads = Math.min(weak_threads_needed, weak_threads_possible_curr);

			// lower threads needed if just not possible
			weak_threads_needed = Math.min(weak_threads_needed, weak_threads_possible_max);

			// if we cannot make enough threads right now (but can do so later),
			//	wait for RAM to get free
			if (weak_threads_possible_curr < weak_threads_needed) {
				ns.tprint("Ran out of RAM");
				// wait until enough RAM is freed
				while (weak_threads_possible_curr < weak_threads_needed) {
					await ns.sleep(10000);
					// recalc
					weak_threads_possible_curr = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / 1.75);
				}
			}

			ns.tprint(`Running ${weak_threads_needed} weakens for ${server.name}`);
			ns.exec(weaken_script, host_server, weak_threads_needed, server.name, 0, id, 20);

			finish_at += 10000;
		}
		
		// then grow-weaken
		if (ns.getServerMoneyAvailable(server.name) < server.max_money) {
			// grow weaken batch
			const grow_multipler_required = server.max_money / ns.getServerMoneyAvailable(server.name);
			// batches needed to attain 100% cash
			let batches_needed = Math.ceil(ns.growthAnalyze(server.name, grow_multipler_required, ns.getServer().cpuCores));

			const jobs = GROW_PER_WEAKEN + 1
			const ram_per_batch = jobs * 1.75;
			// batches we can make currently
			let batches_possible_curr = Math.floor(getServerAvailableRam(ns) / ram_per_batch);
			// batches we can make in ideal scenario (only this script running)
			const batches_possible_max = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / ram_per_batch);

			// lower batches needed if just not possible
			batches_needed = Math.min(batches_needed, batches_possible_max);

			// if we cannot make enough batches right now (but can do so later),
			//	wait for RAM to get free
			if (batches_possible_curr < batches_needed) {
				ns.tprint("Ran out of RAM");
				// wait until enough RAM is freed
				while (batches_possible_curr < batches_needed) {
					await ns.sleep(10000);
					// recalc
					batches_possible_curr = Math.floor(getServerAvailableRam(ns) / ram_per_batch);
				}
			}
			
			ns.tprint(`Running ${batches_needed} batches of grow-weaken for ${server.name}`);
			ns.exec(grow_script, host_server, batches_needed * GROW_PER_WEAKEN, server.name, finish_at - ns.getGrowTime(server.name), id+1, 20);
			finish_at += 10000;
			ns.exec(weaken_script, host_server, batches_needed, server.name, finish_at - ns.getWeakenTime(server.name), id+1, 20);
		}

		id += 2;	
	}

	

	// copy over the batcher script
	// ns.scp([batcher_script], host_server, "home");

	// run it again
	// ns.spawn("/hack/preparer_home.js", 1);
}