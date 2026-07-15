// --- СПИСОК ВСЕХ ЭЛЕМЕНТОВ (ID) ---
export const ELEMENTS = {
    AIR: 0, SAND: 1, WATER: 2, STONE: 3, MINERAL: 4, SOLUTION: 5, 
    CRYSTAL: 6, STEAM: 7, LAVA: 8, WOOD: 9, OIL: 10, ASH: 11, FIRE: 12 
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
    [ELEMENTS.FIRE]: [255, 140, 0]     
};

// --- ФИЗИЧЕСКИЕ И ХИМИЧЕСКИЕ СВОЙСТВА ---
export const PROPERTIES = {
    [ELEMENTS.AIR]: {},
    // Добавлен тег isPowder для унификации гравитации
    [ELEMENTS.SAND]: { isPowder: true, isLiquid: false, isGas: false },
    [ELEMENTS.ASH]: { isPowder: true, isLiquid: false, isGas: false },
    
    // Добавлено evaporateTo для гибкого испарения
    [ELEMENTS.WATER]: { isLiquid: true, isGas: false, canEvaporate: true, evaporateTo: ELEMENTS.STEAM },
    [ELEMENTS.SOLUTION]: { isLiquid: true, isGas: false, canEvaporate: true, evaporateTo: ELEMENTS.CRYSTAL },
    
    [ELEMENTS.STONE]: { isLiquid: false, isGas: false },
    [ELEMENTS.MINERAL]: { isLiquid: false, isGas: false },
    [ELEMENTS.CRYSTAL]: { isLiquid: false, isGas: false },
    
    [ELEMENTS.STEAM]: { isLiquid: false, isGas: true },
    [ELEMENTS.FIRE]: { isLiquid: false, isGas: true, isIgniter: true },
    
    [ELEMENTS.LAVA]: { isLiquid: true, isGas: false, isIgniter: true },
    [ELEMENTS.WOOD]: { isLiquid: false, isGas: false, isFlammable: true },
    [ELEMENTS.OIL]: { isLiquid: true, isGas: false, isFlammable: true }
};