import { NS } from "@ns";

const exec_script = "/tools/exec.js";
// const hack_script = "/hack/just_hack.js";
// const grow_script = "/hack/just_grow.js";
const weaken_script = "/hack/just_weaken.js";

/** @param {NS} ns */
export async function main(ns: NS) {	
	for (let i=1; i<=25; i++) {
        const purchased_server = `homeserv-${i}`
        // if the server doesn't exist, stop
		if (!ns.serverExists(purchased_server)) break;

        // first kill everything on that server
        ns.killall(purchased_server);
        // run weaken script for massive exp
		ns.exec(exec_script, "home", 1, purchased_server, "all", weaken_script, "foodnstuff");
	}
}