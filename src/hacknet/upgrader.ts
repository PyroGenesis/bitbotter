import { NS, NodeStats } from "@ns";
import { HacknetServerConstants } from "/hacknet/constants";

// cheat mode allows calculate various formulas without using formulas.exe
const CHEAT_MODE = false;
const EPSILON_MONEY = 1e-1;
const EPSILON_GAIN = 1e-10;

/** @param {NS} ns */
function getPlayerMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

async function buyNode(ns: NS) {
    const cost = ns.hacknet.getPurchaseNodeCost();
    ns.print(`Buying node ${ns.hacknet.numNodes()} for ${ns.nFormat(cost, "$0.000a")}`);
    while (getPlayerMoney(ns) < cost) {
        await ns.sleep(1000);
    }
    ns.hacknet.purchaseNode();
}

async function upgradeNode(ns: NS, node_idx: number, max_stats: NodeStats, upgrade_cache = true) {
    const stats = ns.hacknet.getNodeStats(node_idx);
    const level_diff = max_stats.level - stats.level;
    const ram_diff = Math.log2(max_stats.ram) - Math.log2(stats.ram);
    const cores_diff = max_stats.cores - stats.cores;
    const cache_diff = (max_stats.cache ?? 1) - (stats.cache ?? 1);

    if (level_diff > 0) {
        const cost = ns.hacknet.getLevelUpgradeCost(node_idx, level_diff);
        ns.print(`Upgrading level of node ${node_idx} for ${ns.nFormat(cost, "$0.000a")}`);
        while (getPlayerMoney(ns) < cost) {
            await ns.sleep(1000);
        }
        ns.hacknet.upgradeLevel(node_idx, level_diff);
    }
    if (ram_diff > 0) {
        const cost = ns.hacknet.getRamUpgradeCost(node_idx, ram_diff);
        ns.print(`Upgrading ram of node ${node_idx} for ${ns.nFormat(cost, "$0.000a")}`);
        while (getPlayerMoney(ns) < cost) {
            await ns.sleep(1000);
        }
        ns.hacknet.upgradeRam(node_idx, ram_diff);
    }
    if (cores_diff > 0) {
        const cost = ns.hacknet.getCoreUpgradeCost(node_idx, cores_diff);
        ns.print(`Upgrading cores of node ${node_idx} for ${ns.nFormat(cost, "$0.000a")}`);
        while (getPlayerMoney(ns) < cost) {
            await ns.sleep(1000);
        }
        ns.hacknet.upgradeCore(node_idx, cores_diff);
    }
    if (upgrade_cache && cache_diff > 0) {
        const cost = ns.hacknet.getCacheUpgradeCost(node_idx, cache_diff);
        ns.print(`Upgrading cache of node ${node_idx} for ${ns.nFormat(cost, "$0.000a")}`);
        while (getPlayerMoney(ns) < cost) {
            await ns.sleep(1000);
        }
        ns.hacknet.upgradeCache(node_idx, cache_diff);
    }
}

function getUpgradeCost_cheat(ns: NS, node_idx: number, to_level: number, to_ram: number, to_cores: number, to_cache: number): number {
    let stats: NodeStats
    if (node_idx === -1) {
        stats = {
            level: 1,
            ram: 1,
            cores: 1,
            cache: 1,
    
            // unused
            name: "",
            production: 0,
            timeOnline: 0,
            totalProduction: 0
        }
    } else {
        stats = ns.hacknet.getNodeStats(node_idx);
    }

    const mults = ns.getHacknetMultipliers();
    let total = 0;

    if (stats.level < to_level) {
        const starting_level = stats.level;
        const levels = to_level - starting_level;

        const level_mult = HacknetServerConstants.UpgradeLevelMult;
        let total_level_multiplier = 0;
        let currLevel = starting_level;
        for (let i = 0; i < levels; ++i) {
            total_level_multiplier += Math.pow(level_mult, currLevel);
            ++currLevel;
        }
        const level_cost2 = 10 * HacknetServerConstants.BaseCost * total_level_multiplier * mults.levelCost;
        total += level_cost2;
    }
    
    if (stats.ram < to_ram) {
        const starting_ram = stats.ram;
        const rams = Math.log2(to_ram) - Math.log2(starting_ram);

        let ram_cost2 = 0;
        let numUpgrades = Math.round(Math.log2(starting_ram));
        let currentRam = starting_ram;
        for (let i = 0; i < rams; ++i) {
            const baseCost = currentRam * HacknetServerConstants.RamBaseCost;
            const mult = Math.pow(HacknetServerConstants.UpgradeRamMult, numUpgrades);
    
            ram_cost2 += baseCost * mult;
    
            currentRam *= 2;
            ++numUpgrades;
        }
        ram_cost2 *= mults.ramCost;
        total += ram_cost2;
    }

    if (stats.cores < to_cores) {
        const starting_cores = stats.cores;
        const cores = to_cores - starting_cores;

        const core_mult = HacknetServerConstants.UpgradeCoreMult;
        let core_cost2 = 0;
        let currentCores = starting_cores;
        for (let i = 0; i < cores; ++i) {
            core_cost2 += Math.pow(core_mult, currentCores - 1);
            ++currentCores;
        }
        core_cost2 *= HacknetServerConstants.CoreBaseCost;
        core_cost2 *= mults.coreCost;
        total += core_cost2;
    }

    if (stats.cache && stats.cache < to_cache) {
        const starting_cache = stats.cache;
        const caches = to_cache - starting_cache;

        const mult = HacknetServerConstants.UpgradeCacheMult;
        let cache_cost2 = 0;
        let currentCache = starting_cache;
        for (let i = 0; i < caches; ++i) {
            cache_cost2 += Math.pow(mult, currentCache - 1);
            ++currentCache;
        }
        cache_cost2 *= HacknetServerConstants.CacheBaseCost;
        total += cache_cost2;
    }

    return total;
}

function assertValues(val1: number, val2: number, epsilon: number, message = ''): boolean {
    if (Math.abs(val1 - val2) > epsilon) {
        alert('Assertion failed: ' + message);
        return false
    }
    return true
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');
    ns.clearLog();
    ns.print('Script started');

    // first, we should have at least 1 node
    let n = ns.hacknet.numNodes();
    if (n === 0) {
        await buyNode(ns);
        n = 1;
    }

    // in case, formulas.exe is not present, we need one more node as s stand-in
    // const hasFormulas = ns.fileExists("Formulas.exe", "home");
    // if (!hasFormulas) {
    //     if (n === 1) await buyNode(ns);
    //     // n is updated so that it doesn't really count the last node
    //     n = ns.hacknet.numNodes() - 1;
    // }

    // make sure all servers are on equal footing
    const max_stats: NodeStats = {
        level: 1,
        ram: 1,
        cores: 1,
        cache: 1,

        // unused
        name: "",
        production: 0,
        timeOnline: 0,
        totalProduction: 0
    }

    // get the max stats
    for (let i=0; i<n; i++) {
        const stats = ns.hacknet.getNodeStats(i);
        max_stats.level = Math.max(max_stats.level, stats.level);
        max_stats.ram = Math.max(max_stats.ram, stats.ram);
        max_stats.cores = Math.max(max_stats.cores, stats.cores);
        max_stats.cache = Math.max(max_stats.cache ?? 1, stats.cache ?? 1);
    }
    // match to the max stats
    for (let i=0; i<n; i++) {
        await upgradeNode(ns, i, max_stats);
    }
    
	let total_production = 0;
    for (let i=0; i<n; i++) {
		const stats = ns.hacknet.getNodeStats(i)
		total_production += stats.totalProduction;
    }
    ns.print(total_production / 4);
    // ns.getBitNodeMultipliers().

    // After this, we can only continue if we have Formulas.exe OR cheat mode is enabled
    const FORMULAS_PRESENT = ns.fileExists("Formulas.exe", "home");
    if (!FORMULAS_PRESENT && !CHEAT_MODE) return;
    
    const mults = ns.getHacknetMultipliers();
    while (true) {
        /* Now, there are 4 ways to increase hash output
            1. Upgrade level
            2. Upgrade RAM
            3. Upgrade cores
            4. Buy new hacknet server and upgrade to current */

        const level_cost = ns.hacknet.getLevelUpgradeCost(0, 1);
        const ram_cost = ns.hacknet.getRamUpgradeCost(0, 1);
        const core_cost = ns.hacknet.getCoreUpgradeCost(0, 1);

        const curr_gain = ns.hacknet.getNodeStats(0).production;

        // gains using formulas.exe
        let level_gain = 0, ram_gain = 0, core_gain = 0;
        if (FORMULAS_PRESENT) {
            level_gain = ns.formulas.hacknetServers.hashGainRate(max_stats.level + 1, 0, max_stats.ram, max_stats.cores, mults.production) - curr_gain;
            ram_gain = ns.formulas.hacknetServers.hashGainRate(max_stats.level, 0, max_stats.ram * 2, max_stats.cores, mults.production) - curr_gain;
            core_gain = ns.formulas.hacknetServers.hashGainRate(max_stats.level, 0, max_stats.ram, max_stats.cores + 1, mults.production) - curr_gain;
        }
        // gains using calculation
        if (CHEAT_MODE) {
            const level_gain_calc = curr_gain / max_stats.level;
            const ram_gain_calc = curr_gain * 0.07
            const core_gain_calc = curr_gain / (max_stats.cores + 4);

            if (FORMULAS_PRESENT) {
                if (!assertValues(level_gain, level_gain_calc, EPSILON_GAIN, 'level_gain vs level_gain_calc')) return;
                if (!assertValues(ram_gain, ram_gain_calc, EPSILON_GAIN, 'ram_gain vs ram_gain_calc')) return;
                if (!assertValues(core_gain, core_gain_calc, EPSILON_GAIN, 'core_gain vs core_gain_calc')) return;
            }

            level_gain = level_gain_calc;
            ram_gain = ram_gain_calc;
            core_gain = core_gain_calc;
        }

        // check limits
        if (max_stats.level === HacknetServerConstants.MaxLevel) level_gain = 0;
        if (max_stats.ram === HacknetServerConstants.MaxRam) ram_gain = 0;
        if (max_stats.cores === HacknetServerConstants.MaxCores) core_gain = 0;

        // cost using formulas.exe
        let upgrade_cost = 0;
        if (FORMULAS_PRESENT) {
            upgrade_cost = ns.formulas.hacknetServers.levelUpgradeCost(1, max_stats.level - 1, mults.levelCost) +
                ns.formulas.hacknetServers.ramUpgradeCost(1, Math.log2(max_stats.ram) - 1, mults.ramCost) +
                ns.formulas.hacknetServers.coreUpgradeCost(1, max_stats.cores - 1, mults.coreCost);
        }
        // gains using calculation
        if (CHEAT_MODE) {
            const upgrade_cost_calc = getUpgradeCost_cheat(ns, -1, max_stats.level, max_stats.ram, max_stats.cores, 0);
            if (FORMULAS_PRESENT) {
                if (!assertValues(upgrade_cost, upgrade_cost_calc, EPSILON_MONEY, 'upgrade_cost vs upgrade_cost_calc')) return;
            }
            upgrade_cost = upgrade_cost_calc;
        }

        const purchase_cost = ns.hacknet.getPurchaseNodeCost() + upgrade_cost
        const purchase_gain = curr_gain;
        
        const level_benefit = level_gain / level_cost;
        const ram_benefit = ram_gain / ram_cost;
        const core_benefit = core_gain / core_cost;
        const purchase_benefit = purchase_gain / purchase_cost;

        let decision: 'level' | 'ram' | 'core' | 'purchase' = 'level';
        let benefit = level_benefit;
        if (ram_benefit > benefit) {
            decision = 'ram';
            benefit = ram_benefit;
        }
        if (core_benefit > benefit) {
            decision = 'core';
            benefit = core_benefit;
        }
        if (purchase_benefit > benefit) {
            decision = 'purchase';
            benefit = purchase_benefit;
        }

        ns.print(`Decision: ${decision}, Benefit: ${benefit}`);
        // await ns.sleep(5 * 1000);
        // continue;
        
        switch (decision) {
            case 'level':
                max_stats.level += 1;
                break;
            case 'ram':
                max_stats.ram *= 2;                
                break;
            case 'core':
                max_stats.cores += 1;                
                break;
            case 'purchase':
                await buyNode(ns);
                n += 1
                break;
        
            default:
                break;
        }

        // match to the max stats
        for (let i=0; i<n; i++) {
            await upgradeNode(ns, i, max_stats, false);
        }

        await ns.sleep(10 * 1000);
    }
}