import { NS } from "@ns";

const startup_script = "/startup/main.js";

const exec_script = "/tools/exec.js";
const nuke_script = "/hack/spider_nuke.js";
const hack_script = "/hack/just_hack.js";
const grow_script = "/hack/just_grow.js";
const weaken_script = "/hack/just_weaken.js";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.run(nuke_script, 1);
    await ns.sleep(1000);

    ns.killall("foodnstuff");
    ns.killall("nectar-net");
    ns.killall("n00dles");
    ns.killall("sigma-cosmetics");
    ns.killall("joesguns");

	ns.run(exec_script, 1, "foodnstuff", grow_script, "-t", "all", "-a", "n00dles");
	ns.run(exec_script, 1, "nectar-net", weaken_script, "-t", "all", "-a", "n00dles");
	ns.run(exec_script, 1, "n00dles", hack_script, "-t", "all", "-a", "n00dles");
	ns.run(exec_script, 1, "sigma-cosmetics", hack_script, "-t", "all", "-a", "n00dles");
	ns.run(exec_script, 1, "joesguns", hack_script, "-t", "all", "-a", "n00dles");

    ns.tprint("Setup scripts for hacking n00dles");

    ns.spawn(startup_script, 1, ...ns.args);
}