import { NS } from "@ns";
import { getServerList, ServerDetail } from 'lib/utils';

// const batcher_script = "/hack/batcher.js";
// const dispatch_script = "/hack/dispatcher.js";
const hack_script = "/stocks/wait_hack.js";
// const grow_script = "/stocks/wait_grow.js";
// const weaken_script = "/stocks/wait_weaken.js";

// const JOB_SPACER = 500;
// const BATCH_SPACER = 500;
// const GROW_PER_WEAKEN = 12;

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
	ns.tprint("Arguments needed for hack_all.js");
	ns.tprint("server    Optional. Single server to hack 100%.");
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
	// do all servers, but give priority to server with more money currently
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
		// sort by current money available
		server_list.sort((a, b) => ns.getServerMoneyAvailable(b.name) - ns.getServerMoneyAvailable(a.name));
	}

	for (const server of server_list) {
		const hack_threads_needed = Math.ceil(ns.hackAnalyzeThreads(server.name, ns.getServerMoneyAvailable(server.name)));
		const hack_threads_possible_max = Math.floor((ns.getServer().maxRam - ns.getScriptRam(ns.getScriptName())) / 1.70);
		let hack_threads_possible_curr = Math.floor(getServerAvailableRam(ns) / 1.70);

		if (hack_threads_needed === 0) continue;

		let possible_now = hack_threads_needed <= hack_threads_possible_curr;
		const possible_later = hack_threads_needed <= hack_threads_possible_max;
		const impossible = !possible_now && !possible_later;

		if (!possible_now && possible_later) {
			// wait until enough RAM is freed
			ns.tprint(`Not enough RAM for hacks on ${server.name}. Will wait until available.`);
			while (!possible_now) {
				await ns.sleep(10000);
				// recalc
				hack_threads_possible_curr = Math.floor(getServerAvailableRam(ns) / 1.70);
				possible_now = hack_threads_needed <= hack_threads_possible_curr;
			}
		}
		if (possible_now) {
			// launch all needed hack threads
			ns.tprint(`Running ${hack_threads_needed} hacks for ${server.name}`);
			ns.exec(hack_script, host_server, hack_threads_needed, server.name, 0, id, 20);
		} else if (impossible) {
			// move on
			ns.tprint(`Server ${server.name} is impossible to hack completely. Moving on...`)
			continue;
		}

		id += 2;	
	}	

	// copy over the batcher script
	// ns.scp([batcher_script], host_server, "home");

	// run it again
	// ns.spawn("/hack/preparer_home.js", 1);
}