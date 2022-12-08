import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    // check for arguments
	if (ns.args.length < 1) {
		ns.print("Not enough arguments");
		return;
	}
    const task = ns.args[0] as string;

    for (const member of ns.gang.getMemberNames()) {
        ns.gang.setMemberTask(member, task);
    }
}