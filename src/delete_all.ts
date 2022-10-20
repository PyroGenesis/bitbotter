import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	const all_scripts = ns.ls(ns.getHostname(), 'js')
	for (const script of all_scripts) {
		// skip current script
		if (script === ns.getScriptName()) continue;

		if (ns.rm(script)) {
			ns.tprint("successfully deleted " + script);
		} else {
			ns.tprint("failed to delete " + script);
		}
	}
}