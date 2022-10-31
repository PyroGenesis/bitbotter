import { NS } from "@ns";

const work = [
    { faction: 'BitRunners', rep: 1e6 },
    { faction: 'The Black Hand', rep: 175000 },
    { faction: 'NiteSec', rep: 112500 },
    { faction: 'Aevum', rep: 100000 },
    { faction: 'Sector-12', rep: 50000 },
    { faction: 'Tian Di Hui', rep: 3750 },
    { faction: 'CyberSec', rep: 0 },
]

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");
    ns.tail();

    work.sort((a, b) => b.rep - a.rep);

    for (const w of work) {
        // if (ns.singularity.getFactionRep(w.faction) >= w.rep) continue;
        ns.singularity.workForFaction(w.faction, 'Hacking Contracts', false);
        while (ns.singularity.getFactionRep(w.faction) < w.rep) {
            await ns.sleep(10 * 1000);
        }
    }
}