const exec_script = "/tools/exec.js";
const hack_script = "/hack/just_hack.js";
const grow_script = "/hack/just_grow.js";
const weaken_script = "/hack/just_weaken.js";

/** @param {import("../../").NS} ns */
export async function main(ns) {
	ns.exec(exec_script, "home", 1, "foodnstuff", "all", grow_script, "n00dles");
	ns.exec(exec_script, "home", 1, "nectar-net", "all", weaken_script, "n00dles");
	ns.exec(exec_script, "home", 1, "n00dles", "all", hack_script, "n00dles");
	ns.exec(exec_script, "home", 1, "sigma-cosmetics", "all", hack_script, "n00dles");
	ns.exec(exec_script, "home", 1, "joesguns", "all", hack_script, "n00dles");
}