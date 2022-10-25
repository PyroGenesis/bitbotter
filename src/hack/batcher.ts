import { NS, Server } from "@ns";

const dispatch_script = "/hack/dispatcher.js";
const hack_script = "/hack/hack_once.js";
const grow_script = "/hack/grow_once.js";
const weaken_script = "/hack/weaken_once.js";

const JOB_SPACER = 500;
const BATCH_SPACER = 500;

class LevelBasedParams {
	// the security decreased by a single weaken thread (this is fixed and does not decrease per hacking level)
	static weaken_security_dec = 0.05;

	ns: NS;
	server: string;
	server_obj: Server;
	max_money: number;

	hack_threads = 0;
	weaken_1_threads = 0;
	grow_threads = 0;
	weaken_2_threads = 0;
	ram_per_batch = 0;
	max_time = 0;
	max_batches = 0;

	/**
	 * @param {NS} ns 
	 * @param {string} server 
	 */
	constructor(ns: NS, server: string) {
		this.ns = ns;
		this.server = server;
		this.server_obj = ns.getServer(server);
		this.max_money = this.server_obj.moneyMax;

		this.update();
	}

	update() {
		// the hack threads for stealing <= 50% money and their security increase
		this.hack_threads = Math.floor(this.ns.hackAnalyzeThreads(this.server, this.max_money * 0.5));
		const hack_security_inc = 0.002 * this.hack_threads; //this.ns.hackAnalyzeSecurity(this.hack_threads, this.server);

		// the number of weaken threads required to offset hack increase
		this.weaken_1_threads = Math.ceil(hack_security_inc / LevelBasedParams.weaken_security_dec);

		// the number of threads needed to double the money back to 100% and their security increase
		this.grow_threads = Math.ceil(this.ns.growthAnalyze(this.server, 2));
		const grow_security_inc = 0.004 * this.grow_threads; //this.ns.growthAnalyzeSecurity(this.grow_threads, this.server, 1);

		// the number of weaken threads required to offset hack increase
		this.weaken_2_threads = Math.ceil(grow_security_inc / LevelBasedParams.weaken_security_dec);

		// hack, weaken, grow, weaken
		this.ram_per_batch = this.ns.getScriptRam(dispatch_script) + (1.70 * this.hack_threads) + (1.75 * this.weaken_1_threads) + (1.75 * this.grow_threads) + (1.75 * this.weaken_2_threads); 		
		
		// max time
		this.server_obj.hackDifficulty = this.server_obj.minDifficulty; //+ Math.max(hack_security_inc, grow_security_inc);		
		this.max_time = this.ns.formulas.hacking.weakenTime(this.server_obj, this.ns.getPlayer());

		// max batches before paywindows fill the whole timeline
		this.max_batches = Math.floor((this.max_time - JOB_SPACER) / (JOB_SPACER * 3 + BATCH_SPACER));
		
		// print details
		this.ns.print("INFO HWGW: ", this.hack_threads, " ", this.weaken_1_threads, " ", this.grow_threads, " ", this.weaken_2_threads)
		this.ns.print("INFO ram_per_batch:", this.ram_per_batch);
		this.ns.print("INFO max_time:", this.max_time);
		this.ns.print("INFO max_batches:", this.max_batches);
	}
}

/**
 * @param {NS} ns 
 */
function getDispatchCount(ns: NS) {
	let dispatchers = 0;
	for (const p of ns.ps()) {
		if (p.filename === dispatch_script) {
			dispatchers++;
		}
	}
	return dispatchers;
}

/** 
 * @param {NS} ns 
 * @param {number} ram_per_batch
*/
function getServerSafeRam(ns: NS, ram_per_batch: number) {
	const ram_used_actual = ns.getServer().ramUsed;
	const ram_used_predicted = ns.getScriptRam(ns.getScriptName()) + getDispatchCount(ns) * ram_per_batch;
	const ram_used = Math.max(ram_used_actual, ram_used_predicted);

	return ns.getServer().maxRam - ram_used;
}

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for batcher.js");
	ns.tprint("server    Server to hack");
	ns.tprint("port      Port to out details on");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	if (ns.args.length < 2) {
		ns.tprint("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const port = ns.args[1] as number;
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

	ns.tail();

	// first make sure that security is lowest and money is highest
	const min_security = ns.getServerMinSecurityLevel(server);
	const max_money = ns.getServerMaxMoney(server);
	if (ns.getServerSecurityLevel(server) > min_security) {
		ns.tprint("Server needs to be weakened more");
		return;
	}
	if (ns.getServerMoneyAvailable(server) < max_money) {
		ns.tprint("Server needs to be grown more");
		return;
	}

	// copy the files over
	ns.scp([dispatch_script, hack_script, grow_script, weaken_script], host_server, "home");

	// kill anything running before
	ns.killall(host_server, true);

	// unique identifier for each batch
	let id = 0;

	// hack level to refresh times
	let hack_level = ns.getHackingLevel();
	// thread vars
	const params = new LevelBasedParams(ns, server);
	// server object
	// let server_obj = ns.getServer(server);
	
	while (true) {
		// need to update thread and timings if hacking level increases
		if (hack_level !== ns.getHackingLevel()) {
			await ns.writePort(port, "WARN hacking level changed");
			ns.print("WARN hacking level changed");

			// kills all dispatch and hack scripts because timings will no longer be consistent
			ns.scriptKill(dispatch_script, host_server);
			ns.scriptKill(hack_script, host_server);

			// wait if there needs to be some grows
			while (ns.getServerMoneyAvailable(server) < max_money) {
				await ns.sleep(JOB_SPACER);
			}
			// then we are done with grows so delete them
			ns.scriptKill(grow_script, host_server);

			// wait if there needs to be some weakens
			while (ns.getServerSecurityLevel(server) > min_security) {
				await ns.sleep(JOB_SPACER);
			}
			// then we are done with weakens so delete them
			ns.scriptKill(weaken_script, host_server);

			// wait until everything finishes
			// while (ns.ps().length > 1) {
			// 	await ns.sleep(JOB_SPACER);
			// }
			
			// update thread counts
			params.update();

			// finally, update hacking level
			hack_level = ns.getHackingLevel();

			await ns.writePort(port, "INFO Updated thread counts");

			// wait for some small time before trying again
			await ns.sleep(200);
			continue;
		}
				
		// sleep if enough ram is not available for a batch
		if (getServerSafeRam(ns, params.ram_per_batch) < params.ram_per_batch) {
			// while (getServerSafeRam(ns, params.ram_per_batch) < params.ram_per_batch) {
			// 	await ns.sleep(JOB_SPACER);
			// }
			await ns.sleep(JOB_SPACER);
			continue;
		}

		// sleep until number of batches lessen back to 0 (skips all paywindows)
		if (getDispatchCount(ns) === params.max_batches) {
			ns.print("WARN: Reached batch limit")
			while (getDispatchCount(ns) > 0) {
				// while waiting for paywindows to finish, if the level changes, go to batch termination at start of loop
				if (hack_level !== ns.getHackingLevel()) {
					break;
				}
				await ns.sleep(JOB_SPACER);
			}
			continue;
		}

		// My logs
		ns.print(`Launched batch: ${id}, Total: ${getDispatchCount(ns)+1}/${params.max_batches}`);
		// ns.print("HWGW: ", params.hack_threads, " ", params.weaken_1_threads, " ", params.grow_threads, " ", params.weaken_2_threads)
		// // ns.print("hack_threads:", params.hack_threads); //, " hack_security_inc:", hack_security_inc);
		// // ns.print("weaken_1_threads:", params.weaken_1_threads);
		// // ns.print("grow_threads:", params.grow_threads); //, " grow_security_inc:", grow_security_inc);
		// // ns.print("weaken_2_threads:", params.weaken_2_threads);
		// ns.print("ram_per_batch:", params.ram_per_batch);
		// ns.print("max_time:", params.max_time);
		// ns.print("max_batches:", params.max_batches);
		// // ns.print("hack_time:", hack_time, " grow_time:", grow_time, " weaken_1_time:", weaken_1_time, " weaken_2_time:", weaken_2_time, " max_time:", max_time);
		// // ns.print("hack_level:", hack_level);
		// ns.print(" ");

		// dispatch
		ns.exec(dispatch_script, host_server, 1, 
				server, host_server, id, port, 
				params.hack_threads, params.weaken_1_threads, params.grow_threads, params.weaken_2_threads,
				JOB_SPACER, params.max_time);

		// increase id (reset it eventually)
		id = (id + 1) % 100000

		// keep a gap between batches
		await ns.sleep(JOB_SPACER * 3 + BATCH_SPACER);
	}
}