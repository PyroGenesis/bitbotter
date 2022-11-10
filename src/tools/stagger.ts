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
	const max_ram_per_stagger_script = Math.max( ...scripts.map((s) => ns.getScriptRam(s, 'home')))
	if (threads === "all") {
		threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / max_ram_per_stagger_script);
	}
	if (threads === 0) {
		ns.print(`No threads available`);
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

	const hack_threads = Math.round(threads * hack_percent / 100);
	const grow_threads = Math.round(threads * grow_percent / 100);
	const weaken_threads = Math.round(threads * weaken_percent / 100);
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
	
	const weaken_batches = Math.trunc(weaken_time / 200);
	const weaken_threads_per_batch = Math.trunc(weaken_threads / weaken_batches);
    for (i = 0; i < weaken_batches; i++) {
        ns.exec(scripts[2], server, weaken_threads_per_batch, target, i);
		await ns.sleep(200);
    }
	ns.exec(scripts[2], server, weaken_threads % weaken_batches, target, i);

	const grow_batches = Math.trunc(grow_time / 200);
	const grow_threads_per_batch = Math.trunc(grow_threads / grow_batches);
    for (i = 0; i < grow_batches; i++) {
        ns.exec(scripts[1], server, grow_threads_per_batch, target, i);
		await ns.sleep(200);
    }
	ns.exec(scripts[1], server, grow_threads % grow_batches, target, i);

	const hack_batches = Math.trunc(hack_time / 200);
	const hack_threads_per_batch = Math.trunc(hack_threads / hack_batches);
    for (i = 0; i < hack_batches; i++) {
        ns.exec(scripts[0], server, hack_threads_per_batch, target, i);
		await ns.sleep(200);
    }
	ns.exec(scripts[0], server, hack_threads % hack_batches, target, i);
    
	ns.tprint(`Ran ${hack_threads}H, ${grow_threads}G, ${weaken_threads}W threads on ${server}`);
}