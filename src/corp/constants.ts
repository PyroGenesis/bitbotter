export const JOBS = ["Operations","Engineer","Business","Management","Research & Development", "Training"];
export const BOOST_MATERIALS = ["Hardware","Robots","AI Cores","Real Estate"]
export const LEVEL_UPGRADES = ["Smart Factories","Smart Storage","FocusWires","Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants","Wilson Analytics"]
export const CITIES = ["Aevum","Chongqing","New Tokyo","Ishima","Volhaven","Sector-12"];

export const MATERIAL_SPACE = { "Hardware": 0.06, "Robots": 0.5, "AI Cores": 0.1, "Real Estate": 0.01 }
export const MATERIAL_SPACE_IDX: {[key: number]: number} = { 0: 0.06, 1: 0.5, 2: 0.1, 3: 0.01 }

export const MATERIAL_RATIOS: {[key: string]: number[]} = {
    "Software": [5, 1, 3, 2],
    "Agriculture": [4, 5, 5, 14],
    "Tobacco": [2, 4, 2, 2],
    "Food": [2, 5, 5, 1],
    "Pharmaceutical": [2, 5, 4, 1],
    "Healthcare": [1, 1, 1, 1],
    "Robotics": [3, 1, 7, 6],
    "Hardware": [1, 7, 3, 4],
    "RealEstate": [1, 11, 11, 1],
    "Mining": [8, 9, 9, 5],
    "Energy": [1, 1, 5, 13],
    "Utilities": [1, 8, 8, 10],
    "Fishing": [6, 10, 4, 2],
    "Chemical": [4, 5, 4, 5],
}