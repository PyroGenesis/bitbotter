import { NS } from "@ns";
import { getServerList, ServerDetail } from 'lib/utils';

// const batcher_script = "/hack/batcher.js";
// const dispatch_script = "/hack/dispatcher.js";
// const hack_script = "/hack/wait_hack.js";
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
	ns.tprint("Arguments needed for preparer_home.js");
	ns.tprint("server    Optional. Server to prepare.");
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
	const target = ns.args.length > 0 ? ns.args[0] as string : null;
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

	// if a target server is mentioned, use that. Otherwise,
	// do all servers, but give priority to server with more money
	let server_list: ServerDetail[];
	if (target !== null) {
		server_list = [{
			name: target,
			max_money: ns.getServerMaxMoney(target),
			max_ram: ns.getServerMaxRam(target),
			min_security: ns.getServerMinSecurityLevel(target)
		}]
	} else {
		server_list = getServerList(ns);
		server_list.sort((a, b) => b.max_money - a.max_money);
	}

	for (const server of server_list) {
		// let min_security = ns.getServerMinSecurityLevel(server.name);
		// let max_money = ns.getServerMaxMoney(server.name);

		// const weaken_time = ns.getWeakenTime(server.name);
		let finish_at = 0; //weaken_time;
		let weaken_script_pid: number | null = null;

		// weaken first
		while (true) {
			// if security level is already lowest, we break
			if (ns.getServerSecurityLevel(server.name) === server.min_security) {
				break;
			} 
			
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
			const can_repeat = !possible_later && weak_threads_possible_curr > 0;

			const weaken_time = ns.getWeakenTime(server.name);

			if (possible_now) {
				// launch all needed weaken threads
				ns.tprint(`Running ${weak_threads_needed} weakens for ${server.name}`);
				weaken_script_pid = ns.exec(weaken_script, host_server, weak_threads_needed, server.name, 0, id, 20);

				finish_at = weaken_time + 10000;
				break;

			} else if (can_repeat) {
				// launch all possible weaken threads, we will do more later
				ns.tprint(`Running ${weak_threads_possible_curr} weakens for ${server.name}. Will repeat for more.`);
				weaken_script_pid = ns.exec(weaken_script, host_server, weak_threads_possible_curr, server.name, 0, id, 20);

				await ns.sleep(weaken_time + 1000);
				// since we wait for finishing, we reset finish time to 0
				finish_at = 0;
				// also, no weaken scripts for this server should be running here

			} else if (possible_later) {
				// wait until enough RAM is freed
				ns.tprint(`Not enough RAM for weakens on ${server.name}. Will wait until available.`);
				while (!possible_now) {
					await ns.sleep(10000);
					// recalc
					weak_threads_possible_curr = Math.floor(getServerAvailableRam(ns) / 1.75);
					possible_now = weak_threads_needed <= weak_threads_possible_curr;
				}
				// no weaken scripts will be running right now, but they will be when the execution loops back
			} else {
				// Nothing is possible right now, wait for RAM to increase
				const curr_ram = getServerAvailableRam(ns);
				while (getServerAvailableRam(ns) <= curr_ram) {
					await ns.sleep(10000);
				}
			}
		}
		
		
		// then grow-weaken
		while (true) {
			// if money is already max, we break
			if (ns.getServerMoneyAvailable(server.name) === server.max_money) break;

			// grow weaken batch
			const grow_multipler_required = server.max_money / Math.max(ns.getServerMoneyAvailable(server.name), 1);
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
			const can_repeat = !possible_later && batches_possible_curr > 0;

			const weaken_time = ns.getWeakenTime(server.name);

			// are any earlier weaken scripts running?
			// only delay if that's the case, otherwise don't
			const is_weaken_running = weaken_script_pid !== null && ns.isRunning(weaken_script_pid)
			const grow_delay = is_weaken_running ? finish_at - ns.getGrowTime(server.name) : 0;
			finish_at += 10000;
			const weaken_delay = is_weaken_running ? finish_at - ns.getWeakenTime(server.name) : 0;
			finish_at += 10000;

			if (possible_now) {
				// launch all needed batches of grow-weaken
				ns.tprint(`Running ${batches_needed} batches of grow-weaken for ${server.name}`);
				ns.exec(grow_script, host_server, batches_needed * GROW_PER_WEAKEN, server.name, grow_delay, id+1, 20);
				ns.exec(weaken_script, host_server, batches_needed, server.name, weaken_delay, id+1, 20);

				break;
			} else if (can_repeat) {
				// launch all possible batches of grow-weaken, we will do more later
				ns.tprint(`Running ${batches_possible_curr} batches of grow-weaken for ${server.name}. Will repeat for more.`);
				ns.exec(grow_script, host_server, batches_possible_curr * GROW_PER_WEAKEN, server.name, grow_delay, id+1, 20);
				ns.exec(weaken_script, host_server, batches_possible_curr, server.name, weaken_delay, id+1, 20);

				// wait for all the batches of grow-weaken to finish
				await ns.sleep(weaken_delay + weaken_time + 1000);

				// since we wait for finishing, no earlier weaken scripts will be running anymore
				finish_at = 0;

			} else if (possible_later) {
				// wait until enough RAM is freed
				ns.tprint(`Not enough RAM for batches of grow-weaken on ${server.name}. Will wait until available.`);

				while (!possible_now) {
					await ns.sleep(10000);
					// recalc
					batches_possible_curr = Math.floor(getServerAvailableRam(ns) / ram_per_batch);
					possible_now = batches_needed <= batches_possible_curr;
				}
			} else {
				// Nothing is possible right now, wait for RAM to increase
				const curr_ram = getServerAvailableRam(ns);
				while (getServerAvailableRam(ns) <= curr_ram) {
					await ns.sleep(10000);
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