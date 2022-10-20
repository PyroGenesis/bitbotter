/** @param {NS} ns */
export async function main(ns) {
	let host_server = ns.getHostname();
	
	// kills all dispatch and hack scripts because timings will no longer be consistent
	ns.scriptKill("/hack/batcher.js", host_server);
	ns.scriptKill("/hack/dispatcher.js", host_server);
	ns.scriptKill("/hack/hack_once.js", host_server);
}