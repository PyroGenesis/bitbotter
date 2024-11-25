import { NS } from "@ns";

function doAction(ns: NS, type: string, name: string) {
    const current = ns.bladeburner.getCurrentAction();
    if (current.type === type && current.name === name) return;
    ns.bladeburner.startAction(type, name);
}

function getAverageChance(ns: NS, type: string, name: string): number {
    const chance = ns.bladeburner.getActionEstimatedSuccessChance(type, name);
    return (chance[0] + chance[1]) / 2;
}

function tryUpgradeLevel(ns: NS, type: string, name: string) {
    if (getAverageChance(ns, type, name) < 0.9) return;
    const current = ns.bladeburner.getActionCurrentLevel(type, name);
    if (current === ns.bladeburner.getActionMaxLevel(type, name)) return;
    ns.bladeburner.setActionLevel(type, name, current+1);
}

function getStaminaPercentage(ns: NS): number {
    const [current, max] = ns.bladeburner.getStamina();
    return current / max;
}

export async function waitForStats(ns: NS) {
    while (true) {
        const player = ns.getPlayer();

        if (player.skills.strength < 100 || player.skills.defense < 100 || player.skills.dexterity < 100 || player.skills.agility < 100) {
            await ns.sleep(5000);
        } else if (player.skills.charisma < (player.skills.strength + player.skills.defense + player.skills.dexterity + player.skills.agility) / 4) {
            // train charisma
            doAction(ns, 'General', 'Recruitment');
            await ns.sleep(5000);
        } else {
            break;
        }
    }    
}

export async function beforeBountyHunter(ns: NS) {
    ns.bladeburner.setActionAutolevel('Contract', 'Tracking', false);
    ns.bladeburner.setActionAutolevel('Contract', 'Bounty Hunter', false);
    
    let mode: 'Tracking' | 'Field Analysis' = 'Tracking';
    while (true) {
        // check bounty hunter
        if (getAverageChance(ns, 'Contract', 'Bounty Hunter') > 0.8) break;

        // try to upgrade Tracking
        tryUpgradeLevel(ns, 'Contract', 'Tracking');

        // modify mode (if needed)
        if (mode === 'Tracking' && getStaminaPercentage(ns) <= 0.5) {
            mode = 'Field Analysis';
        } else if (mode === 'Field Analysis' && getStaminaPercentage(ns) > 0.95) {
            mode = 'Tracking'
        }

        // do action
        switch (mode) {
            case 'Tracking':
                doAction(ns, 'Contract', mode);
                break;
        
            case 'Field Analysis':
                doAction(ns, 'General', mode);
                break;

            default:
                break;
        }

        await ns.sleep(5000);
    }    
}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog('sleep');
	ns.clearLog();
	ns.print('Script start');
	ns.tail();

    // wait for resonable stats
    await waitForStats(ns);
	
    // initially we only do Field Analysis and Tracking (until we get Bounty Hunter up)
    await beforeBountyHunter(ns);
}