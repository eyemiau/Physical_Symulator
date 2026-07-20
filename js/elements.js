// --- СПИСОК ВСЕХ ЭЛЕМЕНТОВ (ID) ---
export const ELEMENTS = {
    AIR: 0, 
    WALL: 1,
    SAND: 2, 
    WATER: 3, 
    STONE: 4, 
    MINERAL: 5, 
    SOLUTION: 6, 
    CRYSTAL: 7, 
    STEAM: 8, 
    LAVA: 9, 
    WOOD: 10, 
    OIL: 11, 
    ASH: 12, 
    FIRE: 13,
    ACID: 14, 
    TOXIC_GAS: 15, 
    GUNPOWDER: 16, 
    DIRT: 17, 
    SEED: 18, 
    PLANT: 19, 
    ICE: 20,
    SALT: 21, 
    SALT_WATER: 22,    
};

// --- ЦВЕТА ЭЛЕМЕНТОВ (RGB) ---
export const COLORS = {
    [ELEMENTS.AIR]: [0, 0, 0],
    [ELEMENTS.WALL]: [255, 127, 80],
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
    [ELEMENTS.SEED]: [250, 180, 100],
    [ELEMENTS.PLANT]: [34, 139, 34],
    [ELEMENTS.ICE]: [173, 216, 230],   
    [ELEMENTS.SALT]: [245, 245, 245], 
    [ELEMENTS.SALT_WATER]: [20, 160, 200],    
};

// --- ФИЗИЧЕСКИЕ И ХИМИЧЕСКИЕ СВОЙСТВА ---
export const PROPERTIES = {
    [ELEMENTS.AIR]: {density: 1.2},

    // -- СЫПУЧЕЕ
    [ELEMENTS.SAND]: { 
        isPowder: true, 
        isLiquid: false, 
        isGas: false, 
        density: 1600
    },
    [ELEMENTS.ASH]: { 
        isPowder: true, 
        isLiquid: false, 
        isGas: false,
         density: 1600
    },
    [ELEMENTS.GUNPOWDER]: { 
        isPowder: true, 
        explosionRadius: 10, 
        density: 1700
    }, 
    [ELEMENTS.DIRT]: { 
        isPowder: true,
         density: 1300 
        },
    [ELEMENTS.SEED]: { 
        isPowder: true, 
        density: 1100 
    },

    [ELEMENTS.SALT]: { 
        isPowder: true, 
        density: 2160 
    },

    // -- ЖИДКОСТИ  
    [ELEMENTS.WATER]: { 
        isLiquid: true, 
        isGas: false, 
        canEvaporate: true, 
        evaporateTo: ELEMENTS.STEAM, 
        canFreeze: true, 
        freezeTo: ELEMENTS.ICE, 
        freezeTemp: 0, 
        density: 1000,
    },

    [ELEMENTS.SALT_WATER]: { 
        isLiquid: true, 
        isGas: false, 
        density: 1030, // Тяжелее обычной воды (1000)!
        canEvaporate: true, 
        evaporateTo: ELEMENTS.STEAM // Пар улетит... а что останется? Доработаем ниже!
    },

    [ELEMENTS.SOLUTION]: { 
        isLiquid: true, 
        isGas: false, 
        canEvaporate: true, 
        evaporateTo: ELEMENTS.CRYSTAL, 
        density: 1130
    },

    [ELEMENTS.ACID]: { 
        isLiquid: true, 
        canEvaporate: true, 
        evaporateTo: ELEMENTS.TOXIC_GAS, 
        density: 1200
    },

    [ELEMENTS.OIL]: { 
        isLiquid: true, 
        isGas: false, 
        isFlammable: true,
        density: 800
    },

    [ELEMENTS.LAVA]: { 
        isLiquid: true, 
        isGas: false, 
        isIgniter: true, 
        heatRadius: 10, 
        canFreeze: true,
        freezeTo: ELEMENTS.STONE,
        freezeTemp: 50,
        density: 3100
    },

    // -- ТВЁРДЫЕ
    [ELEMENTS.STONE]: { 
        isLiquid: false, 
        isGas: false,         
        density: 2500
    },

    [ELEMENTS.CRYSTAL]: { 
        isLiquid: false, 
        isGas: false, 
        isAcidResistant: true, 
        density: 2650
    },

    [ELEMENTS.WOOD]: { 
        isLiquid: false, 
        isGas: false, 
        isFlammable: true, 
        density: 600
    },

    [ELEMENTS.ICE]: { 
        isLiquid: false, 
        isGas: false, 
        canMelt: true, 
        meltTo: ELEMENTS.WATER,
        meltTemp: 0, 
        density: 920 
    },

    [ELEMENTS.WALL]: { 
        isLiquid: false, 
        isGas: false, 
        density: Infinity, 
        isStatic: true, 
        isAcidResistant: true 
    },

    // -- ГАЗЫ И ПРОЧЕЕ
    [ELEMENTS.STEAM]: { isLiquid: false, isGas: true, density: 0.6},
    [ELEMENTS.FIRE]: { isLiquid: false, isGas: true, isIgniter: true, heatRadius: 7, density: 0.3},
    [ELEMENTS.TOXIC_GAS]: { isLiquid: false, isGas: true, density: 1.5},
    [ELEMENTS.PLANT]: { isLiquid: false, isGas: false, isFlammable: true, density: 600 },
};
