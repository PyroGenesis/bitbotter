import { NS } from "@ns";

const MAX_BRACKET = 6;

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.print("script start");
    ns.tail();

    while (true) {
        for (const member of ns.gang.getMemberNames()) {
            const asc_info = ns.gang.getAscensionResult(member);
            if (asc_info === undefined) {
                await ns.sleep(1 * 1000);
                continue;
            }
    
            const member_info = ns.gang.getMemberInformation(member);
            
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
            if (lowest_bracket === MAX_BRACKET) {
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
            
            if (charisma_training_needed) {
                ns.gang.setMemberTask(member, "Human Trafficking");
            } else if (combat_training_needed) {
                ns.gang.setMemberTask(member, "Train Combat");
            } else if (hack_training_needed) {
                ns.gang.setMemberTask(member, "Train Hacking");
            } else {
                ns.gang.ascendMember(member);
                ns.gang.setMemberTask(member, "Territory Warfare");
            }
    
            await ns.sleep(10 * 1000);
        }
        ns.clearLog();
    }    
}