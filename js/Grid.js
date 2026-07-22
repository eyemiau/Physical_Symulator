import { audioManager } from './AudioManager.js';
import { ELEMENTS, PROPERTIES } from './elements.js'; // Твоя старая строка
// import { ELEMENTS, PROPERTIES } from './elements.js';

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

    tryDisplace(x, y, dx, dy, myDensity) {
        const nx = x + dx;
        const ny = y + dy;
        const targetType = this.getCell(nx, ny);

        if (PROPERTIES[targetType]?.isStatic) return false;

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

    tryBuoyancy(x, y, dx, dy, myDensity, isGas = false) {
        const nx = x + dx;
        const ny = y + dy;
        const targetType = this.getCell(nx, ny);

        if (PROPERTIES[targetType]?.isStatic) return false;

        if (targetType === ELEMENTS.AIR) {
            if (isGas) {
                this.swap(x, y, nx, ny);
                return true;
            }
            return false;
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
                if (type === ELEMENTS.AIR) continue;

                const props = PROPERTIES[type] || {};

                // Убрали isStatic, чтобы цветы продолжали расти и проводить воду
                this.updated[index] = this.frameCounter;

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
                if (type === ELEMENTS.SALT_WATER) {
                    this.setCell(x, y, Math.random() > 0.5 ? ELEMENTS.SALT : props.evaporateTo);
                } else {
                    this.setCell(x, y, props.evaporateTo); 
                }
                // ТРИГГЕР ЗВУКА: Звучит только в момент превращения жидкости в газ
                audioManager.queueEvent(ELEMENTS.STEAM, 'evaporate'); 
                return true;
            }
        }

        if (props.canFreeze && this.temperature <= props.freezeTemp) {
            if (Math.random() < 0.1) {
                this.setCell(x, y, props.freezeTo); 
                return true;
            }
        }

        if (props.canMelt && this.temperature > props.meltTemp) {
            if (Math.random() < 0.05) {
                this.setCell(x, y, props.meltTo); 
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
            case ELEMENTS.FLOWER_SEED:
            case ELEMENTS.FLOWER_STEM: { 
                // 1. Капиллярная диффузия (исключаем стебли, чтобы не было утечки воды)
                if (type !== ELEMENTS.FLOWER_STEM && this.moisture[index] > 0) {
                    const randomDir = CROSS_NEIGHBORS[Math.floor(Math.random() * CROSS_NEIGHBORS.length)];
                    const nx = x + randomDir[0];
                    const ny = y + randomDir[1];
                    const nType = this.getCell(nx, ny);

                    if (nType === ELEMENTS.DIRT || nType === ELEMENTS.PLANT || nType === ELEMENTS.SEED || 
                        nType === ELEMENTS.FLOWER_SEED || nType === ELEMENTS.FLOWER_STEM) {
                        const nIndex = this.getIndex(nx, ny);
                        if (this.moisture[index] > this.moisture[nIndex]) {
                            this.moisture[index]--;
                            this.moisture[nIndex]++;
                        }
                    }
                }

                if (type === ELEMENTS.DIRT) {
                    for (let [dx, dy] of CROSS_NEIGHBORS) {
                        const nx = x + dx, ny = y + dy;
                        const nType = this.getCell(nx, ny);
                        
                        if (nType === ELEMENTS.WATER || nType === ELEMENTS.SALT_WATER) {
                            this.setCell(nx, ny, ELEMENTS.AIR);
                            const bonus = (nType === ELEMENTS.SALT_WATER) ? 100 : 50;
                            this.moisture[index] = Math.min(255, this.moisture[index] + bonus); 
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
                    if (this.moisture[index] >= 11 && Math.random() < 0.43) {
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
                else if (type === ELEMENTS.FLOWER_SEED) {
                    if (this.moisture[index] > 10) {
                        this.setCell(x, y, ELEMENTS.FLOWER_STEM);
                        this.moisture[index] -= 10; 
                        this.durability[index] = 10 + Math.floor(Math.random() * 6); 
                    }
                }
                else if (type === ELEMENTS.FLOWER_STEM) {
                    if (this.moisture[index] >= 5 && Math.random() < 0.3) {
                        const heightLeft = this.durability[index];
                        
                        if (heightLeft > 1) {
                            const cellAbove = this.getCell(x, y - 1);
                            // Пробиваемся сквозь жидкости!
                            if (cellAbove === ELEMENTS.AIR || cellAbove === ELEMENTS.WATER || cellAbove === ELEMENTS.SALT_WATER) {
                                this.setCell(x, y - 1, ELEMENTS.FLOWER_STEM);
                                const newIndex = this.getIndex(x, y - 1);
                                this.durability[newIndex] = heightLeft - 1; 
                                this.moisture[newIndex] = 5; 
                                this.moisture[index] -= 5;
                            }
                        } else if (heightLeft === 1) {
                            const colorIdx = Math.floor(Math.random() * 4) + 1; 
                            const bloom = (bx, by) => {
                                const cType = this.getCell(bx, by);
                                if (cType === ELEMENTS.AIR || cType === ELEMENTS.WATER || cType === ELEMENTS.SALT_WATER) {
                                    this.setCell(bx, by, ELEMENTS.FLOWER_PETAL);
                                    this.moisture[this.getIndex(bx, by)] = colorIdx; 
                                }
                            };
                            bloom(x - 1, y - 1); bloom(x, y - 1); bloom(x + 1, y - 1); 
                            bloom(x - 1, y - 2);                  bloom(x + 1, y - 2); 
                            
                            this.durability[index] = 0; 
                            this.moisture[index] -= 5;
                        }
                    }
                }
                break; 
            }

            // == ЖИВОТНЫЙ МИР (ИИ) ==
            case ELEMENTS.BUG: {
                if (this.durability[index] === 0) {
                    this.durability[index] = 100; // Максимальная сытость при рождении
                }

                let ateSomething = false;
                
                // 1. Поиск еды
                for (let [dx, dy] of CROSS_NEIGHBORS) {
                    const nx = x + dx, ny = y + dy;
                    const neighborType = this.getCell(nx, ny);
                    const nProps = PROPERTIES[neighborType] || {};

                    if (nProps.isOrganic) {
                        this.setCell(nx, ny, ELEMENTS.BUG); // Размножение!
                        this.durability[index] = 255; 
                        this.durability[this.getIndex(nx, ny)] = 255; 
                        
                        ateSomething = true;
                        return true; 
                    }
                }
                
                // 2. Логика голода и РОЕВОГО ДВИЖЕНИЯ
                if (!ateSomething) {
                    if (Math.random() < 0.5) {
                        this.durability[index]--;
                    }
                    
                    if (this.durability[index] <= 1) {
                        this.setCell(x, y, ELEMENTS.DIRT); // Умер от голода
                        return true;
                    }

                    // Броуновское (хаотичное) движение роя!
                    if (Math.random() < 0.7) {
                        const dx = Math.floor(Math.random() * 3) - 1; 
                        const dy = Math.floor(Math.random() * 3) - 1; 
                        if (dx !== 0 || dy !== 0) {
                            if (this.isEmpty(x + dx, y + dy)) {
                                this.swap(x, y, x + dx, y + dy);
                                audioManager.queueEvent(ELEMENTS.BUG, 'move');
                                return true;
                            }
                        }
                    }
                    
                    if (Math.random() < 0.4 && this.isEmpty(x, y + 1)) {
                        this.swap(x, y, x, y + 1);
                        audioManager.queueEvent(ELEMENTS.BUG, 'move');
                        return true;
                    }
                }
                break;
            }

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

            case ELEMENTS.SALT: 
                for (let [dx, dy] of CROSS_NEIGHBORS) {
                    const nx = x + dx, ny = y + dy;
                    if (this.getCell(nx, ny) === ELEMENTS.WATER) {
                        this.setCell(nx, ny, ELEMENTS.SALT_WATER);
                        this.setCell(x, y, ELEMENTS.AIR);
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
                        audioManager.queueEvent(ELEMENTS.ACID, 'dissolve');
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
        const myType = this.getCell(x, y); // ДОБАВЛЕНО: запоминаем, кто падает

        if (props.isStatic || (!props.isPowder && !props.isLiquid && !props.isGas)) return;

       if (props.isPowder) {
            let moved = false;
            let newX = x;
            let newY = y;

            if (this.tryDisplace(x, y, 0, 1, myDensity)) {
                moved = true; newX = x; newY = y + 1;
            } else if (this.tryDisplace(x, y, dir, 1, myDensity)) {
                moved = true; newX = x + dir; newY = y + 1;
            } else if (this.tryDisplace(x, y, -dir, 1, myDensity)) {
                moved = true; newX = x - dir; newY = y + 1;
            }

            if (moved) {
                if (myType === ELEMENTS.SEED || myType === ELEMENTS.FLOWER_SEED) {
                    // Смотрим, что находится ровно под нашей НОВОЙ позицией
                    const below = this.getCell(newX, newY + 1);
                    
                    // Поверхность — это всё, что не воздух, не жидкость/газ, и ГЛАВНОЕ: не другая семечка!
                    const isSurface = below !== ELEMENTS.AIR && 
                                      !PROPERTIES[below]?.isLiquid && 
                                      !PROPERTIES[below]?.isGas && 
                                      below !== ELEMENTS.SEED && 
                                      below !== ELEMENTS.FLOWER_SEED;
                    
                    // Если мы в 1 пикселе от земли или катимся по ней — издаем короткий звук
                    if (isSurface) {
                        audioManager.queueEvent(myType, 'move');
                    }
                } else {
                    // Для песка, земли и пороха всё звучит как обычно
                    audioManager.queueEvent(myType, 'move');
                }
                return true;
            }
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
            
            if (this.tryBuoyancy(x, y, 0, -1, myDensity, true)) return;
            if (this.tryBuoyancy(x, y, dir, -1, myDensity, true)) return;
            if (this.tryBuoyancy(x, y, -dir, -1, myDensity, true)) return;
            if (this.tryDisplace(x, y, dir, 0, myDensity)) return;
            if (this.tryDisplace(x, y, -dir, 0, myDensity)) return;
        }
    }
}