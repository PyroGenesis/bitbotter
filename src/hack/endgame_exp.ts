import { NS } from "@ns";

const exec_script = "/tools/exec.js";
// const hack_script = "/hack/just_hack.js";
// const grow_script = "/hack/just_grow.js";
const weaken_script = "/hack/just_weaken.js";

/** @param {NS} ns */
export async function main(ns: NS) {	
	for (let i=1; i<=25; i++) {
		if (!ns.serverExists(`homeserv-${i}`)) break;
		ns.exec(exec_script, "home", 1, `homeserv-${i}`, "all", weaken_script, "foodnstuff");
	}
}