import { ELEMENTS, PROPERTIES } from './elements.js';

// Выносим соседей в константу для оптимизации Garbage Collector
const CROSS_NEIGHBORS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.length = width * height; 
        this.temperature = 20;
        
        this.types = new Uint8Array(this.length);      
        this.moisture = new Uint8Array(this.length);   
        this.durability = new Uint8Array(this.length); 
        this.updated = new Uint8Array(this.length);
        this.frameCounter = 1;
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return ELEMENTS.STONE; 
        return this.types[this.getIndex(x, y)];
    }

    isEmpty(x, y) {
        return this.getCell(x, y) === ELEMENTS.AIR;
    }

    isElement(x, y, elementType) {
        return this.getCell(x, y) === elementType;
    }

    setCell(x, y, type) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const index = this.getIndex(x, y);
        this.types[index] = type;
        this.updated[index] = this.frameCounter; 
    }

    swap(x1, y1, x2, y2) {
        const index1 = this.getIndex(x1, y1);
        const index2 = this.getIndex(x2, y2);
        
        const tempType = this.types[index1];
        this.types[index1] = this.types[index2];
        this.types[index2] = tempType;

        this.updated[index1] = this.frameCounter;
        this.updated[index2] = this.frameCounter;
    }

    // УНИВЕРСАЛЬНЫЙ ДВИГАТЕЛЬ ПАДЕНИЯ И ВЫТЕСНЕНИЯ
    tryDisplace(x, y, dx, dy, myDensity) {
        const nx = x + dx;
        const ny = y + dy;
        const targetType = this.getCell(nx, ny);
        
        if (targetType === ELEMENTS.STONE) return false;

        if (targetType === ELEMENTS.AIR) {
            this.swap(x, y, nx, ny);
            return true;
        }

        const targetProps = PROPERTIES[targetType] || {};
        const targetDensity = targetProps.density || 0;

        if (myDensity > targetDensity && (targetProps.isLiquid || targetProps.isGas)) {
            this.swap(x, y, nx, ny);
            return true;
        }
        return false;
    }

    // УНИВЕРСАЛЬНЫЙ ДВИГАТЕЛЬ ВСПЛЫТИЯ (Для газов)
    tryBuoyancy(x, y, dx, dy, myDensity) {
        const nx = x + dx;
        const ny = y + dy;
        const targetType = this.getCell(nx, ny);
        
        if (targetType === ELEMENTS.STONE) return false;

        if (targetType === ELEMENTS.AIR) {
            this.swap(x, y, nx, ny);
            return true;
        }

        const targetProps = PROPERTIES[targetType] || {};
        const targetDensity = targetProps.density || 0;

        if (myDensity < targetDensity && (targetProps.isLiquid || targetProps.isGas)) {
            this.swap(x, y, nx, ny);
            return true;
        }
        return false;
    }

    update() {
        this.frameCounter = (this.frameCounter % 255) + 1;
        const goRight = Math.random() > 0.5;

        for (let y = this.height - 1; y >= 0; y--) {
            for (let i = 0; i < this.width; i++) {
                const x = goRight ? i : this.width - 1 - i;
                const index = this.getIndex(x, y);

                if (this.updated[index] === this.frameCounter) continue;

                const type = this.types[index];
                if (type === ELEMENTS.AIR || type === ELEMENTS.STONE) continue;

                this.updated[index] = this.frameCounter; 
                const props = PROPERTIES[type] || {};

                if (this.processReactions(x, y, type, props)) continue;
                this.processPhysics(x, y, props);
            }
        }
    }

    processReactions(x, y, type, props) {
        const index = this.getIndex(x, y);

        // --- ГЛОБАЛЬНЫЕ РЕАКЦИИ ---
        if (props.canEvaporate && this.temperature >= 80) {
            if (Math.random() < 0.08 * (this.temperature / 160)) {
                this.setCell(x, y, props.evaporateTo); 
                return true;
            }
        }

        if (props.heatRadius) {
            for (let dy = -props.heatRadius; dy <= props.heatRadius; dy++) {
                for (let dx = -props.heatRadius; dx <= props.heatRadius; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx, ny = y + dy;
                    const targetType = this.getCell(nx, ny);
                    if (PROPERTIES[targetType]?.canEvaporate && Math.random() < 0.05) {
                        this.setCell(nx, ny, PROPERTIES[targetType].evaporateTo);
                    }
                }
            }
        }

        if (props.isIgniter) {
            for (let [dx, dy] of CROSS_NEIGHBORS) {
                const nx = x + dx, ny = y + dy;
                if (PROPERTIES[this.getCell(nx, ny)]?.isFlammable) {
                    this.setCell(nx, ny, ELEMENTS.FIRE);
                }
            }
        }

        // --- СПЕЦИФИЧНЫЕ РЕАКЦИИ ---
        switch (type) {
            // == БИОЛОГИЯ ==
            case ELEMENTS.DIRT:
            case ELEMENTS.PLANT:
            case ELEMENTS.SEED:
                // Капиллярная диффузия
                if (this.moisture[index] > 0) {
                    const randomDir = CROSS_NEIGHBORS[Math.floor(Math.random() * CROSS_NEIGHBORS.length)];
                    const nx = x + randomDir[0];
                    const ny = y + randomDir[1];
                    const nType = this.getCell(nx, ny);

                    if (nType === ELEMENTS.DIRT || nType === ELEMENTS.PLANT || nType === ELEMENTS.SEED) {
                        const nIndex = this.getIndex(nx, ny);
                        if (this.moisture[index] > this.moisture[nIndex]) {
                            this.moisture[index]--;
                            this.moisture[nIndex]++;
                        }
                    }
                }

                if (type === ELEMENTS.DIRT) {
                    for (let [dx, dy] of CROSS_NEIGHBORS) {
                        if (this.getCell(x + dx, y + dy) === ELEMENTS.WATER) {
                            this.setCell(x + dx, y + dy, ELEMENTS.AIR);
                            this.moisture[index] = Math.min(255, this.moisture[index] + 50); 
                            return true;
                        }
                    }
                } 
                else if (type === ELEMENTS.SEED) {
                    if (this.moisture[index] > 10) {
                        this.setCell(x, y, ELEMENTS.PLANT);
                        this.moisture[index] -= 10; 
                    }
                } 
                else if (type === ELEMENTS.PLANT) {
                    if (this.moisture[index] >= 10 && Math.random() < 0.4) {
                        const growX = x + (Math.floor(Math.random() * 3) - 1); 
                        const growY = y - 1;

                        if (this.isEmpty(growX, growY)) {
                            let plantNeighbors = 0;
                            for (let [ndx, ndy] of CROSS_NEIGHBORS) {
                                if (this.getCell(growX + ndx, growY + ndy) === ELEMENTS.PLANT) {
                                    plantNeighbors++;
                                }
                            }

                            if (plantNeighbors <= 2) {
                                this.setCell(growX, growY, ELEMENTS.PLANT);
                                const newIndex = this.getIndex(growX, growY);
                                this.moisture[newIndex] = 5; 
                                this.moisture[index] -= 10; 
                            }
                        }
                    }
                }
                break;

            // == ХИМИЯ И ТЕРМОДИНАМИКА ==
            case ELEMENTS.FIRE:
                if (Math.random() < 0.1) {
                    this.setCell(x, y, Math.random() < 0.1 ? ELEMENTS.ASH : ELEMENTS.AIR);
                    return true; 
                }
                break;

            case ELEMENTS.WATER:
                for (let [dx, dy] of CROSS_NEIGHBORS) {
                    const nx = x + dx, ny = y + dy;
                    const neighbor = this.getCell(nx, ny);
                    
                    if (neighbor === ELEMENTS.MINERAL) {
                        this.setCell(nx, ny, ELEMENTS.AIR);
                        this.setCell(x, y, ELEMENTS.SOLUTION);
                        return true; 
                    }
                    if (neighbor === ELEMENTS.LAVA) {
                        this.setCell(nx, ny, ELEMENTS.STONE);
                        this.setCell(x, y, ELEMENTS.STEAM);
                        return true; 
                    }
                }
                break;

            case ELEMENTS.ACID:
                for (let [dx, dy] of CROSS_NEIGHBORS) {
                    const nx = x + dx, ny = y + dy;
                    const neighbor = this.getCell(nx, ny);
                    const nProps = PROPERTIES[neighbor] || {};

                    if (neighbor !== ELEMENTS.AIR && !nProps.isLiquid && !nProps.isGas && !nProps.isAcidResistant) {
                        this.setCell(nx, ny, ELEMENTS.AIR);       
                        this.setCell(x, y, ELEMENTS.TOXIC_GAS);   
                        return true; 
                    }
                }
                break;

            case ELEMENTS.GUNPOWDER:
                let ignited = false;
                for (let [dx, dy] of CROSS_NEIGHBORS) {
                    if (PROPERTIES[this.getCell(x + dx, y + dy)]?.isIgniter) {
                        ignited = true; break; 
                    }
                }
                if (ignited) {
                    const r = props.explosionRadius;
                    for (let dy = -r; dy <= r; dy++) {
                        for (let dx = -r; dx <= r; dx++) {
                            if (dx*dx + dy*dy <= r*r) {
                                this.setCell(x + dx, y + dy, Math.random() < 0.2 ? ELEMENTS.FIRE : ELEMENTS.AIR);
                            }
                        }
                    }
                    return true; 
                }
                break;

            case ELEMENTS.STEAM:
                if (y === 0) { this.setCell(x, y, ELEMENTS.WATER); return true; }
                break;

            case ELEMENTS.TOXIC_GAS:
                if (y === 0) { this.setCell(x, y, ELEMENTS.AIR); return true; }
                break;
        }
        return false;
    }

    processPhysics(x, y, props) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        const myDensity = props.density || 0;

        if (props.isPowder) {
            if (this.tryDisplace(x, y, 0, 1, myDensity)) return;
            if (this.tryDisplace(x, y, dir, 1, myDensity)) return;
            if (this.tryDisplace(x, y, -dir, 1, myDensity)) return;
        } 
        else if (props.isLiquid) {
            if (this.tryDisplace(x, y, 0, 1, myDensity)) return;
            if (this.tryDisplace(x, y, dir, 1, myDensity)) return;
            if (this.tryDisplace(x, y, -dir, 1, myDensity)) return;
            if (this.tryDisplace(x, y, dir, 0, myDensity)) return;
            if (this.tryDisplace(x, y, -dir, 0, myDensity)) return;
        } 
        else if (props.isGas) {
            if (Math.random() > 0.27) return; 
            if (this.tryBuoyancy(x, y, 0, -1, myDensity)) return;
            if (this.tryBuoyancy(x, y, dir, -1, myDensity)) return;
            if (this.tryBuoyancy(x, y, -dir, -1, myDensity)) return;
            if (this.tryDisplace(x, y, dir, 0, myDensity)) return;
            if (this.tryDisplace(x, y, -dir, 0, myDensity)) return;
        }
    }
}
