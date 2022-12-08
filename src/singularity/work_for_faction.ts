import { NS } from "@ns";

const work = [
    { faction: 'BitRunners', rep: 1e6 },
    { faction: 'The Black Hand', rep: 175000 },
    { faction: 'NiteSec', rep: 112500 },
    { faction: 'Aevum', rep: 100000 },
    { faction: 'Sector-12', rep: 50000 },
    { faction: 'Tian Di Hui', rep: 3750 },
    { faction: 'CyberSec', rep: 0 },
    { faction: 'Chongqing', rep: 50000 },
    { faction: 'New Tokyo', rep: 50000 },
    { faction: 'Ishima', rep: 50000 },
    { faction: 'Netburners', rep: 12500 },
]

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");
    ns.tail();

    const joined_factions = new Set(ns.getPlayer().factions);
    work.sort((a, b) => b.rep - a.rep);

    for (const w of work) {
        if (!joined_factions.has(w.faction)) continue;

        ns.singularity.workForFaction(w.faction, 'Hacking Contracts', false);
        while (ns.singularity.getFactionRep(w.faction) < w.rep) {
            await ns.sleep(10 * 1000);
        }
    }
}