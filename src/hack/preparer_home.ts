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

		// const weaken_time = ns.getWeakenTime(server.name);
		let finish_at = 0; //weaken_time;

		// weaken first
		while (true) {
			// if security level is already lowest, we break
			if (ns.getServerSecurityLevel(server.name) === server.min_security) break;
			
			// threads needed to attain min security
			const weak_threads_needed = Math.ceil((ns.getServerSecurityLevel(server.name) - server.min_security) / 0.05);
			// threads we can make currently
			let weak_threads_possible_curr = Math.floor(getServerAvailableRam(ns) / 1.75);
			// threads we can make in ideal scenario (only this script running)
			const weak_threads_possible_max = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / 1.75);

			// whether we have enough RAM to fulfill all weakens needed right now
			let possible_now = weak_threads_needed <= weak_threads_possible_curr;
			// whether we will have enough RAM to fulfill all weakens needed, but don't have enough right now
			const possible_later = weak_threads_needed <= weak_threads_possible_max;
			// we do not have enough RAM to fulfill all weakens needed, not even later, so we do the weakens in batches
			const need_to_repeat = !possible_later;

			const weaken_time = ns.getWeakenTime(server.name);

			if (possible_now) {
				// launch all needed weaken threads
				ns.tprint(`Running ${weak_threads_needed} weakens for ${server.name}`);
				ns.exec(weaken_script, host_server, weak_threads_needed, server.name, 0, id, 20);

				finish_at = weaken_time + 10000;
				break;

			} else if (need_to_repeat) {
				// launch all possible weaken threads, we will do more later
				ns.tprint(`Running ${weak_threads_possible_curr} weakens for ${server.name}. Will repeat for more.`);
				ns.exec(weaken_script, host_server, weak_threads_possible_curr, server.name, 0, id, 20);

				await ns.sleep(weaken_time + 1000);

			} else if (possible_later) {
				// wait until enough RAM is freed
				ns.tprint(`Not enough RAM for weakens on ${server.name}. Will wait until available.`);
				while (!possible_now) {
					await ns.sleep(10000);
					// recalc
					weak_threads_possible_curr = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / 1.75);
					possible_now = weak_threads_needed <= weak_threads_possible_curr;
				}
			}
		}
		
		
		// then grow-weaken
		while (true) {
			// if money is already max, we break
			if (ns.getServerMoneyAvailable(server.name) === server.max_money) break;

			// grow weaken batch
			const grow_multipler_required = server.max_money / ns.getServerMoneyAvailable(server.name);
			// batches needed to attain 100% cash
			const batches_needed = Math.ceil(ns.growthAnalyze(server.name, grow_multipler_required, ns.getServer().cpuCores) / GROW_PER_WEAKEN);

			const jobs = GROW_PER_WEAKEN + 1
			const ram_per_batch = jobs * 1.75;
			// batches we can make currently
			let batches_possible_curr = Math.floor(getServerAvailableRam(ns) / ram_per_batch);
			// batches we can make in ideal scenario (only this script running)
			const batches_possible_max = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / ram_per_batch);

			// whether we have enough RAM to fulfill all batches needed right now
			let possible_now = batches_needed <= batches_possible_curr;
			// whether we will have enough RAM to fulfill all batches needed, but don't have enough right now
			const possible_later = batches_needed <= batches_possible_max;
			// we do not have enough RAM to fulfill all batches needed, not even later, so we do the batches in batches
			const need_to_repeat = !possible_later;

			const weaken_time = ns.getWeakenTime(server.name);

			if (possible_now) {
				// launch all needed batches of grow-weaken
				ns.tprint(`Running ${batches_needed} batches of grow-weaken for ${server.name}`);
				ns.exec(grow_script, host_server, batches_needed * GROW_PER_WEAKEN, server.name, finish_at - ns.getGrowTime(server.name), id+1, 20);
				finish_at += 10000;
				ns.exec(weaken_script, host_server, batches_needed, server.name, finish_at - ns.getWeakenTime(server.name), id+1, 20);

				break;
			} else if (need_to_repeat) {
				// launch all possible batches of grow-weaken, we will do more later
				ns.tprint(`Running ${batches_possible_curr} batches of grow-weaken for ${server.name}. Will repeat for more.`);
				ns.exec(grow_script, host_server, batches_possible_curr * GROW_PER_WEAKEN, server.name, finish_at - ns.getGrowTime(server.name), id+1, 20);
				finish_at += 10000;
				ns.exec(weaken_script, host_server, batches_possible_curr, server.name, finish_at - ns.getWeakenTime(server.name), id+1, 20);

				await ns.sleep(weaken_time + 1000);

			} else if (possible_later) {
				// wait until enough RAM is freed
				ns.tprint(`Not enough RAM for batches of grow-weaken on ${server.name}. Will wait until available.`);
				while (!possible_now) {
					await ns.sleep(10000);
					// recalc
					batches_possible_curr = Math.floor(getServerAvailableRam(ns) / ram_per_batch);
					possible_now = batches_needed <= batches_possible_curr;
				}
			}
		}

		id += 2;	
	}

	

	// copy over the batcher script
	// ns.scp([batcher_script], host_server, "home");

	// run it again
	// ns.spawn("/hack/preparer_home.js", 1);
}