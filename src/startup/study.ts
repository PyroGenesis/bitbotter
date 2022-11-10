import { NS } from "@ns";

const startup_script = "/startup/main.js";

/** @param {NS} ns */
export async function main(ns: NS) {
	if (ns.getHackingLevel() < 20) {
        ns.tprint("Studying Computer Science for XP");
		ns.singularity.universityCourse('Rothman University', 'Study Computer Science', false);

        while (ns.getHackingLevel() < 20) {
            ns.sleep(10 * 1000);
        }
        ns.tprint("Finished studying Computer Science");
	}

    ns.spawn(startup_script, 1, ...ns.args);
}