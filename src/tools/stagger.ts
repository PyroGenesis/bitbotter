import { NS } from "@ns";

// const scripts = ["/hack/stagger/hack.js", "/hack/stagger/grow.js", "/hack/stagger/weaken.js"];
const scripts = ["/hack/just_hack.js", "/hack/just_grow.js", "/hack/just_weaken.js"];

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for stagger.js");
	ns.tprint("server        Server to execute on");
	ns.tprint("threads       The number of threads that will used to run the script. Enter 'all' to run the maximum possible amount.");
	ns.tprint("target        The target server.");
	// ns.tprint("operation     The operation that will executed towards the target. hack / grow / weaken / all");
	ns.tprint("ratio     	 The ratio to divide HW operations on. Example: 10-60-30.");
	// ns.tprint("...args            Any extra args will be passed to the script which will be run.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog('sleep');
	ns.clearLog();
	ns.print("Script start");

	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	if (ns.args.length < 4) {
		ns.print("Not enough arguments");
		ns.tail();
		return;
	}

	// store args in variables
	const server = ns.args[0] as string;
	let threads = ns.args[1] as number | "all";
    const target = ns.args[2] as string;
	// const operation = ns.args[3] as string;
	const ratio = ns.args[3] as string;
	
	// check for root access
    if (!ns.hasRootAccess(server) || !ns.hasRootAccess(target)) {
		ns.print(`Don't have root on ${server} or ${target}`);
		ns.tail();
		return;
	}

	// threads
	const max_ram_per_stagger_script = Math.max( ...scripts.map((s) => ns.getScriptRam(s, 'home')));	
	const max_threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / max_ram_per_stagger_script);

	// if we cannot launch even a single thread
	if (max_threads === 0) {
		ns.print(`No threads available`);
		ns.tail();
		return;
	}
	if (threads === "all") {
		// set number of threads to the max possible
		threads = max_threads;
	} else if (threads > max_threads) {
		// threads required are more than possible
		ns.print(`Threads requested: ${threads}, threads possible: ${max_threads}`);
		ns.tail();
		return;
	}
	ns.print(`Total threads: ${threads}`);

	const ratio_split = ratio.split('-');
	if (ratio_split.length !== 3) {
		ns.print(`Invalid ratio split: ${ratio}`);
		ns.tail();
		return;
	}
	
	const hack_percent = parseInt(ratio_split[0]);
	const grow_percent = parseInt(ratio_split[1]);
	const weaken_percent = parseInt(ratio_split[2]);	
	if ((hack_percent + grow_percent + weaken_percent) !== 100) {
		ns.print(`Ratio ${ratio} does not add upto 100%`);
		ns.tail();
		return;
	}
	ns.print(`H: ${hack_percent}%, G: ${grow_percent}%, W: ${weaken_percent}%`);

	const hack_threads = Math.floor(threads * hack_percent / 100);
	const grow_threads = Math.ceil(threads * grow_percent / 100);
	const weaken_threads = Math.floor(threads * weaken_percent / 100);
	if ((hack_threads + grow_threads + weaken_threads) > threads) {
		ns.print(`Something went wrong with rounding. ${hack_threads}H + ${grow_threads}G + ${weaken_threads}W !== ${threads}`);
		ns.print(`${threads * hack_percent / 100}H + ${threads * grow_percent / 100}G + ${threads * weaken_percent / 100}W !== ${threads}`);
		ns.tail();
		return;
	} 
	ns.print(`Threads: ${hack_threads}H + ${grow_threads}G + ${weaken_threads}W`);

	const hack_time = ns.getHackTime(target);
	const grow_time = ns.getGrowTime(target);
	const weaken_time = ns.getWeakenTime(target);

	if (!ns.scp(scripts, server, "home")) {
		ns.print(`Failed to copy ${scripts} to ${server}`);
		ns.tail();
		return;
	}

    // loop and stagger
	ns.tail();
	let i: number;
	
	const weaken_batches = weaken_time / 200;
	const weaken_threads_per_batch = weaken_threads / weaken_batches;
	let weakens_launched = 0;
	for (i = 0; i < weaken_batches; i++) {
		const weakens_now = weaken_threads_per_batch * (i + 1);
		const weakens_to_be_launched = Math.trunc(weakens_now - weakens_launched);
		if (weakens_to_be_launched >= 1) {
			ns.exec(scripts[2], server, weakens_to_be_launched, target, (i * 200) / 1000);
			weakens_launched += weakens_to_be_launched;
		}
		await ns.sleep(200);
    }

	const grow_batches = grow_time / 200;
	const grow_threads_per_batch = grow_threads / grow_batches;
	let grows_launched = 0;
	for (i = 0; i < grow_batches; i++) {
		const grows_now = grow_threads_per_batch * (i + 1);
		const grows_to_be_launched = Math.trunc(grows_now - grows_launched);
		if (grows_to_be_launched >= 1) {
			ns.exec(scripts[1], server, grows_to_be_launched, target, (i * 200) / 1000);
			grows_launched += grows_to_be_launched;
		}
		await ns.sleep(200);
    }
	
	const hack_batches = hack_time / 200;
	const hack_threads_per_batch = hack_threads / hack_batches;
	let hacks_launched = 0;
	for (i = 0; i < hack_batches; i++) {
		const hacks_now = hack_threads_per_batch * (i + 1);
		const hacks_to_be_launched = Math.trunc(hacks_now - hacks_launched);
		if (hacks_to_be_launched >= 1) {
			ns.exec(scripts[0], server, hacks_to_be_launched, target, (i * 200) / 1000);
			hacks_launched += hacks_to_be_launched;
		}
		await ns.sleep(200);
    }
    
	ns.tprint(`Ran ${hack_threads}H, ${grow_threads}G, ${weaken_threads}W threads on ${server}`);
}