import { NS } from "@ns";

const startup_script = "/startup/main.js";
const study_script = "/startup/study.js";
const n00dles_script = "/startup/n00dles.js";
const router_script = "/startup/router.js";
const programs_script = "/startup/programs.js";

const all_scripts = [ study_script, n00dles_script, router_script, programs_script ];

/** @param {NS} ns */
function getAvailableRam(ns: NS) {
	return ns.getServer().maxRam - ns.getServer().ramUsed + ns.getScriptRam(ns.getScriptName());
}

/** @param {NS} ns */
export async function main(ns: NS) {
	const step = ns.args.length > 0 ? ns.args[0] as number : 0;

	switch (step) {
		case 0: {
			let ram_needed = 0;
			for (const script of all_scripts) {
				ram_needed = Math.max(ram_needed, ns.getScriptRam(script));
			}
			if (ram_needed > getAvailableRam(ns)) {
				ns.print(`Insufficient RAM. Required: ${ram_needed}GB, Available: ${getAvailableRam(ns)}`);
				ns.tail();
				return;
			} else {
				ns.spawn(startup_script, 1, 1);
			}
			break;
		}

		case 1: {
			ns.spawn(study_script, 1, 2);
			break;
		}

		case 2: {
			ns.spawn(n00dles_script, 1, 3);
			break;
		}

		case 3: {
			ns.spawn(router_script, 1, 4);
			break;
		}

		case 4: {
			ns.spawn(programs_script, 1, 5);
			break;
		}
	
		default:
			ns.print(`Invalid step: ${step}`);
			ns.tail();
			break;
	}
}