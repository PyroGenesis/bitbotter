import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    const augs = ns.gang.getEquipmentNames().filter((eq) => ns.gang.getEquipmentType(eq) === "Augmentation");

    for (const member of ns.gang.getMemberNames()) {
        for (const aug of augs) {
            ns.gang.purchaseEquipment(member, aug);
        }
    }
}