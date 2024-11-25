import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    for (const member of ns.gang.getMemberNames()) {
        for (const aug of ns.gang.getEquipmentNames()) {
            ns.gang.purchaseEquipment(member, aug);
        }
    }
}