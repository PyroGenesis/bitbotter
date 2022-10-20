import { NS } from "@ns";

const exec_script = "/tools/exec.js";
const hack_script = "/hack/just_hack.js";
const grow_script = "/hack/just_grow.js";
const weaken_script = "/hack/just_weaken.js";

/** @param {NS} ns */
export async function main(ns: NS) {
	if (ns.getHackingLevel() < 20) {
		ns.print("Level up to hacking level 20 first.");
		ns.tail();
		return;
	}

	ns.exec(exec_script, "home", 1, "foodnstuff", "all", grow_script, "n00dles");
	ns.exec(exec_script, "home", 1, "nectar-net", "all", weaken_script, "n00dles");
	ns.exec(exec_script, "home", 1, "n00dles", "all", hack_script, "n00dles");
	ns.exec(exec_script, "home", 1, "sigma-cosmetics", "all", hack_script, "n00dles");
	ns.exec(exec_script, "home", 1, "joesguns", "all", hack_script, "n00dles");
}