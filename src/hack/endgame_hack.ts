import { NS } from "@ns";
import { getServerList } from "lib/utils";

const exec_script = "/tools/exec.js";
// const hack_script = "/hack/just_hack.js";
// const grow_script = "/hack/just_grow.js";
// const weaken_script = "/hack/just_weaken.js";
const preparer_script = "/hack/preparer.js";

/** @param {NS} ns */
export async function main(ns: NS) {
    const server_list = getServerList(ns);
    server_list.sort((a, b) => b.max_money - a.max_money);

    let server_idx = 0
	for (let i = 1; i <= 25; i++) {
        const purchased_server = `homeserv-${i}`
        // if the server doesn't exist, stop
		if (!ns.serverExists(purchased_server)) break;

        // first kill everything on that server
        ns.killall(purchased_server);
        // run preparer.js for the best money server
		ns.exec(exec_script, "home", 1, purchased_server, 1, preparer_script, server_list[server_idx].name, i);
        // select next server to be hacked
        server_idx++;
	}
}