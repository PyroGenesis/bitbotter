import { NS } from "@ns";
import { copyAndExec } from '/lib/utils';

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for exec.js");
	ns.tprint("<server>        Server to execute on");
	ns.tprint("<script>        The script that will be copied and executed on the server");
	ns.tprint("-t <threads>    Optional. The number of threads that will used to run the script. Enter 'all' to run the maximum possible amount. Defaults to 1.");
	ns.tprint("-f <files>      Optional. Comma separated list of files to be copied before execution");
	ns.tprint("-a <args>       Optional. Additional args to be provided to the script. Has to be the last argument switch.");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for required arguments
	if (ns.args.length < 2) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const script = ns.args[1] as string;

	// Optional args
	let threads: number | "all" = 1;
	let files: string[] = [];
	let additional_args: (string | number | boolean)[] = []

	for (let i = 2; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-t':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the number of threads OR 'all' after the -t argument");
					ns.tail();
					return;
				}
				threads = ns.args[i+1] as number | "all";
				i++;
				break;
						
			case '-f':
				if (i+1 > ns.args.length) {
					ns.print("Please provide the files to copy after the -f argument");
					ns.tail();
					return;
				}
				files = (ns.args[i+1] as string).split(',');
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

	// copy over dependent files
	ns.scp(files, server, 'home');

	await copyAndExec(ns, server, script, threads, ...additional_args);
}