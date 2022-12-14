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
	ns.tprint("-s <server>     Optional. Single server to hack.");
	ns.tprint("-p <percent>    Optional. Percent of money to hack. Default: 50%");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// check for arguments
	// if (ns.args.length < 1) {
	// 	ns.tprint("Not enough arguments");
	// 	return;
	// }
	// let server = ns.args[0];
	// let port = parseInt(ns.args[1]);

	let target = null;
	let percent = 50;
	for (let i = 0; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case 'help':
				printArgs(ns);
				return;
			
			case '-s':
				if (i+1 > ns.args.length) {
					ns.print("Please provide a target server name after the -s argument");
					ns.tail();
					return;
				}
				target = ns.args[i+1] as string;
				i++;
				break;
						
			case '-p':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the percent of money to hack after the -p argument");
					ns.tail();
					return;
				}
				percent = ns.args[i+1] as number;
				i++;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}
	
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
		const hack_threads_needed = Math.ceil(ns.hackAnalyzeThreads(server.name, ns.getServerMoneyAvailable(server.name) * (percent / 100)));
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