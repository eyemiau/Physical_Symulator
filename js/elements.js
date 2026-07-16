// --- СПИСОК ВСЕХ ЭЛЕМЕНТОВ (ID) ---
export const ELEMENTS = {
    AIR: 0, SAND: 1, WATER: 2, STONE: 3, MINERAL: 4, SOLUTION: 5, 
    CRYSTAL: 6, STEAM: 7, LAVA: 8, WOOD: 9, OIL: 10, ASH: 11, FIRE: 12,
    ACID: 13, TOXIC_GAS: 14, GUNPOWDER: 15, DIRT: 16, SEED: 17, PLANT: 18,
};

// --- ЦВЕТА ЭЛЕМЕНТОВ (RGB) ---
export const COLORS = {
    [ELEMENTS.AIR]: [0, 0, 0],
    [ELEMENTS.SAND]: [194, 178, 128],
    [ELEMENTS.WATER]: [35, 137, 218],
    [ELEMENTS.STONE]: [128, 128, 128],
    [ELEMENTS.MINERAL]: [46, 139, 87],
    [ELEMENTS.SOLUTION]: [100, 149, 237],
    [ELEMENTS.CRYSTAL]: [216, 191, 216],
    [ELEMENTS.STEAM]: [220, 220, 220],
    [ELEMENTS.LAVA]: [255, 69, 0],
    [ELEMENTS.WOOD]: [139, 69, 19],
    [ELEMENTS.OIL]: [40, 40, 40],
    [ELEMENTS.ASH]: [50, 50, 50],      
    [ELEMENTS.FIRE]: [255, 140, 0],
    [ELEMENTS.ACID]: [173, 255, 47],
    [ELEMENTS.TOXIC_GAS]: [154, 205, 50],
    [ELEMENTS.GUNPOWDER]: [60, 72, 60],
    [ELEMENTS.DIRT]: [101, 67, 33],     
    [ELEMENTS.SEED]: [205, 133, 63],    
    [ELEMENTS.PLANT]: [34, 139, 34],    
};

// --- ФИЗИЧЕСКИЕ И ХИМИЧЕСКИЕ СВОЙСТВА ---
export const PROPERTIES = {
    [ELEMENTS.AIR]: {density: 1.2},
    // -- СЫПУЧЕЕ
    [ELEMENTS.SAND]: { isPowder: true, isLiquid: false, isGas: false, density: 1600},
    [ELEMENTS.ASH]: { isPowder: true, isLiquid: false, isGas: false, density: 700},
    [ELEMENTS.GUNPOWDER]: { isPowder: true, explosionRadius: 10, density: 1700}, 
    [ELEMENTS.DIRT]: { isPowder: true, density: 1300 },
    [ELEMENTS.SEED]: { isPowder: true, density: 1100 },
    // -- ЖИДКОСТИ  
    [ELEMENTS.WATER]: { isLiquid: true, isGas: false, canEvaporate: true, evaporateTo: ELEMENTS.STEAM, density: 1000},
    [ELEMENTS.SOLUTION]: { isLiquid: true, isGas: false, canEvaporate: true, evaporateTo: ELEMENTS.CRYSTAL, density: 1030},
    [ELEMENTS.ACID]: { isLiquid: true, canEvaporate: true, evaporateTo: ELEMENTS.TOXIC_GAS, density: 1200},
    [ELEMENTS.OIL]: { isLiquid: true, isGas: false, isFlammable: true, density: 800},
    [ELEMENTS.LAVA]: { isLiquid: true, isGas: false, isIgniter: true, heatRadius: 10, density: 3100},
    // -- ТВЁРДЫЕ
    [ELEMENTS.STONE]: { isLiquid: false, isGas: false, density: 2500},
    [ELEMENTS.MINERAL]: { isLiquid: false, isGas: false, density: 1200},
    [ELEMENTS.CRYSTAL]: { isLiquid: false, isGas: false, isAcidResistant: true, density: 2560},
    [ELEMENTS.WOOD]: { isLiquid: false, isGas: false, isFlammable: true, density: 600},
    // -- ГАЗЫ И ПРОЧЕЕ
    [ELEMENTS.STEAM]: { isLiquid: false, isGas: true, density: 0.6},
    [ELEMENTS.FIRE]: { isLiquid: false, isGas: true, isIgniter: true, heatRadius: 7, density: 0.3},
    [ELEMENTS.TOXIC_GAS]: { isLiquid: false, isGas: true, density: 1.5},
    [ELEMENTS.PLANT]: { isLiquid: false, isGas: false, isFlammable: true, density: 600 },
};
