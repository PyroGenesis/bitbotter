import { NS } from "@ns";

/** @param {NS} ns */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function main(ns: { tprint: (arg0: any) => void; heart: { break: () => any; }; getHacknetMultipliers: () => any; }) {
    ns.tprint(ns.heart.break());
    ns.tprint(ns.getHacknetMultipliers());
    // ns.exploit();
}