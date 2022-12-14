import { NS } from "@ns";

const MAX_BRACKET = 6;

interface GangAction {
    member: string,
    bracket: number,
    action: string
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print("script start");
    ns.tail();

    let power = ns.gang.getGangInformation().power;
    const territory = ns.gang.getGangInformation().territory;
    let actions: GangAction[] = [];

    while (true) {
        // get members
        const members = ns.gang.getMemberNames();
        
        // set everyone to territory
        // only if we don't have all the territory
        if (territory < 1) {
            for (const member of members) {
                ns.gang.setMemberTask(member, "Territory Warfare");
            }
        }

        // calc optimum roles (while waiting for territory tick to happen)
        actions = []
        for (const member of members) {
            const action: GangAction = {
                member: member,
                bracket: 0,
                action: ''
            };
            actions.push(action);

            const member_info = ns.gang.getMemberInformation(member);
            const asc_info = ns.gang.getAscensionResult(member);
            if (asc_info === undefined) {
                action.action = "Human Trafficking";
                ns.print(`${member} cannot yet be ascended`);
                await ns.sleep(1 * 1000);
                continue;
            }
                
            const hack_bracket = Math.trunc(Math.log2(member_info.hack_asc_mult));
            const hack_mult_needed = Math.pow(2, hack_bracket + 1) / member_info.hack_asc_mult;
            const str_bracket = Math.trunc(Math.log2(member_info.str_asc_mult));
            const str_mult_needed = Math.pow(2, str_bracket + 1) / member_info.str_asc_mult;
            const def_bracket = Math.trunc(Math.log2(member_info.def_asc_mult));
            const def_mult_needed = Math.pow(2, def_bracket + 1) / member_info.def_asc_mult;
            const dex_bracket = Math.trunc(Math.log2(member_info.dex_asc_mult));
            const dex_mult_needed = Math.pow(2, dex_bracket + 1) / member_info.dex_asc_mult;
            const agi_bracket = Math.trunc(Math.log2(member_info.agi_asc_mult));
            const agi_mult_needed = Math.pow(2, agi_bracket + 1) / member_info.agi_asc_mult;
            const cha_bracket = Math.trunc(Math.log2(member_info.cha_asc_mult));
            const cha_mult_needed = Math.pow(2, cha_bracket + 1) / member_info.cha_asc_mult;
    
            const lowest_bracket = Math.min(hack_bracket, str_bracket, def_bracket, dex_bracket, agi_bracket, cha_bracket);
            action.bracket = lowest_bracket;

            if (lowest_bracket === MAX_BRACKET) {
                actions.pop();
                ns.print(`${member} is on highest tier ${MAX_BRACKET}`);
                await ns.sleep(1 * 1000);
                continue;
            }
    
            const hack_training_needed = hack_bracket === lowest_bracket && asc_info.hack < hack_mult_needed;
            const combat_training_needed = (str_bracket === lowest_bracket && asc_info.str < str_mult_needed) ||
                                            (def_bracket === lowest_bracket && asc_info.def < def_mult_needed) ||
                                            (dex_bracket === lowest_bracket && asc_info.dex < dex_mult_needed) ||
                                            (agi_bracket === lowest_bracket && asc_info.agi < agi_mult_needed);
            const charisma_training_needed = cha_bracket === lowest_bracket && asc_info.cha < cha_mult_needed;
            
            if (combat_training_needed) {
                action.action = "Train Combat";
            } else if (charisma_training_needed) {
                action.action = "Human Trafficking";
            } else if (hack_training_needed) {
                action.action = "Train Hacking";
            } else {
                action.action = "Ascend";
            }
        }

        // wait for territory tick to go over
        // only if we don't have all the territory
        if (territory < 1) {
            while (power === ns.gang.getGangInformation().power) {
                await ns.sleep(200);
            }
            power = ns.gang.getGangInformation().power;
        }

        // switch everyone to their optimum tasks
        for (const ga of actions) {
            if (ga.action === '') {
                continue;
            } else if (ga.action === 'Ascend') {
                ns.gang.ascendMember(ga.member);
                ns.gang.purchaseEquipment(ga.member, 'Ford Flex V20');
                if (ga.bracket >= 3) {
                    ns.gang.purchaseEquipment(ga.member, 'ATX1070 Superbike');
                }
                ns.gang.setMemberTask(ga.member, "Train Combat");
            } else {
                ns.gang.setMemberTask(ga.member, ga.action);
            }    
        }

        // sleep for 18 seconds
        await ns.sleep(18 * 1000);
        ns.clearLog();
    }    
}