import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for stagger.js");
	ns.tprint("server                Server to execute on");
	ns.tprint("threads               The number of threads that will used to run the script. Enter 'all' to run the maximum possible amount.");
	ns.tprint("stagger operation     The operation that will executed towards the target");
	ns.tprint("target                The target server.");
	// ns.tprint("...args            Any extra args will be passed to the script which will be run.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for arguments
	if (ns.args.length < 4) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	let threads = ns.args[1] as number | "all";
	const operation = ns.args[2] as string;
    const target = ns.args[3] as string;

    if (!ns.hasRootAccess(server) || !ns.hasRootAccess(target)) {
		ns.print(`Don't have root on ${server} or ${target}`);
		ns.tail();
		return;
	}

    let operation_time = 0;
    let script: string;
    switch (operation) {
        case "hack":
            operation_time = ns.getHackTime(target);
            script = "/hack/stagger/hack.js";
            break;
    
        case "grow":
            operation_time = ns.getGrowTime(target);
            script = "/hack/stagger/grow.js";
            break;
        
        case "weaken":
            operation_time = ns.getWeakenTime(target);
            script = "/hack/stagger/weaken.js";
            break;
        
        default:
            ns.print(`Invalid operation: ${operation}`);
            ns.tail();
            return;
    }

	if (!ns.scp(script, server, "home")) {
		ns.print(`Failed to copy ${script} to ${server}`);
		ns.tail();
		return;
	}

	// threads
	if (threads === "all") {
		threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script, server));
	}

    // loop and stagger
    for (let i = 0; i < threads; i++) {
        // run the script
        ns.exec(script, server, 1, target, operation_time, i, threads);
    }
    
	ns.tprint(`Ran ${threads} threads on ${server}`);
}