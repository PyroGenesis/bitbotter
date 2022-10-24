import { NS } from "@ns";

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for spawner.js");
	ns.tprint("-s <script>    Script (with path) to spawn.");
	ns.tprint("-m <mem>       Optional. Amount of memory to leave free, in GB.");
	ns.tprint("-a <args>      Optional. Additional args to be provided to the script. Has to be the last argument switch.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	let script = null;
	let memory_to_leave = 0;
	let additional_args: (string | number | boolean)[] = []

	for (let i = 0; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case 'help':
				printArgs(ns);
				return;
			
			case '-s':
				if (i+1 > ns.args.length) {
					ns.print("Please provide a script file path after the -s argument");
					ns.tail();
					return;
				}
				script = ns.args[i+1] as string;
				i++;
				break;
						
			case '-m':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the memory to leave free after the -m argument");
					ns.tail();
					return;
				}
				memory_to_leave = ns.args[i+1] as number;
				i++;
				break;
						
			case '-a':
				additional_args = ns.args.slice(i + 1);
				i = ns.args.length;
				break;
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	// check for arguments
	if (script === null) {
		ns.print("Please provide a script file path after the -s argument");
		ns.tail();
		return;
	}

	// if not home, copy the script to be executed from home
	if (ns.getHostname() !== 'home') {
		ns.scp(script, ns.getHostname(), 'home');
	}

	// ns.print(ns.getServer().maxRam, " ", ns.getScriptRam(script))
	// return;
	const max_threads = Math.floor((ns.getServer().maxRam - memory_to_leave) / ns.getScriptRam(script));
	if (max_threads <= 0) {
		ns.print("No threads can be launched")
		ns.tail();
		return;
	}
	
	// spawn the script
	ns.spawn(script, max_threads, ...additional_args);
}