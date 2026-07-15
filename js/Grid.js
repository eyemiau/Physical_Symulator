import { ELEMENTS, PROPERTIES } from './elements.js';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.length = width * height; 
        this.temperature = 20;
        
        this.types = new Uint8Array(this.length);      
        this.moisture = new Uint8Array(this.length);   
        this.durability = new Uint8Array(this.length); 
        
        // Буфер для защиты от множественных обновлений за один кадр
        this.updated = new Uint8Array(this.length);
        this.frameCounter = 1;
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    isEmpty(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.types[this.getIndex(x, y)] === ELEMENTS.AIR;
    }

    isElement(x, y, elementType) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.types[this.getIndex(x, y)] === elementType;
    }

    setCell(x, y, type) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const index = this.getIndex(x, y);
        this.types[index] = type;
        this.updated[index] = this.frameCounter; // Помечаем как обновленную
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return ELEMENTS.STONE; 
        return this.types[this.getIndex(x, y)];
    }

    swap(x1, y1, x2, y2) {
        const index1 = this.getIndex(x1, y1);
        const index2 = this.getIndex(x2, y2);
        
        const tempType = this.types[index1];
        this.types[index1] = this.types[index2];
        this.types[index2] = tempType;

        // Обе клетки считаются обновленными в этом кадре
        this.updated[index1] = this.frameCounter;
        this.updated[index2] = this.frameCounter;
    }

    // Универсальная попытка сдвига клетки
    tryMove(x, y, dx, dy) {
        if (this.isEmpty(x + dx, y + dy)) {
            this.swap(x, y, x + dx, y + dy);
            return true;
        }
        return false;
    }

    update() {
        // Увеличиваем счетчик кадров (избегаем переполнения, обнуляем до 1, так как 0 - начальное состояние)
        this.frameCounter = (this.frameCounter % 255) + 1;
        
        // Случайное направление обхода по X предотвращает "заваливание" симуляции в левую сторону
        const goRight = Math.random() > 0.5;

        for (let y = this.height - 1; y >= 0; y--) {
            for (let i = 0; i < this.width; i++) {
                const x = goRight ? i : this.width - 1 - i;
                const index = this.getIndex(x, y);

                // Защита от телепортации: пропускаем клетку, если она уже двигалась в этом кадре
                if (this.updated[index] === this.frameCounter) continue;

                const type = this.types[index];
                if (type === ELEMENTS.AIR || type === ELEMENTS.STONE) continue;

                this.updated[index] = this.frameCounter; 

                // 1. Химия и жизненный цикл (если клетка уничтожилась или изменилась - прерываем)
                if (this.processReactions(x, y, type)) continue;

                // 2. Физика и движение
                this.processPhysics(x, y, type);
            }
        }
    }

    processReactions(x, y, type) {
        const props = PROPERTIES[type];

        // --- ЖИЗНЕННЫЙ ЦИКЛ ОГНЯ ---
        if (type === ELEMENTS.FIRE) {
            if (Math.random() < 0.1) {
                this.setCell(x, y, Math.random() < 0.1 ? ELEMENTS.ASH : ELEMENTS.AIR);
                return true; 
            }
        }

        // --- ИСПАРЕНИЕ ---
        if (props.canEvaporate && this.temperature >= 80) {
            if (Math.random() < 0.08 * (this.temperature / 160)) {
                this.setCell(x, y, props.evaporateTo); 
                return true;
            }
        }

        // --- ХИМИЯ ОГНЯ ---
        if (props.isIgniter) {
            const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (let [dx, dy] of neighbors) {
                const nx = x + dx, ny = y + dy;
                const neighborType = this.getCell(nx, ny);
                if (PROPERTIES[neighborType]?.isFlammable) {
                    this.setCell(nx, ny, ELEMENTS.FIRE);
                }
            }
        }

        // --- РЕАКЦИИ ВОДЫ ---
        if (type === ELEMENTS.WATER) {
            const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (let [dx, dy] of neighbors) {
                // 1. Растворение минералов
                if (this.isElement(x + dx, y + dy, ELEMENTS.MINERAL)) {
                    this.setCell(x + dx, y + dy, ELEMENTS.AIR);
                    this.setCell(x, y, ELEMENTS.SOLUTION);
                    return true; 
                }
                
                // 2. Взаимодействие с Лавой (твой код!)
                if (this.isElement(x + dx, y + dy, ELEMENTS.LAVA)) {
                    this.setCell(x + dx, y + dy, ELEMENTS.STONE);
                    this.setCell(x, y, ELEMENTS.STEAM);
                    return true; 
                }
            }
        }

        // --- КОНДЕНСАЦИЯ ПАРА ---
        if (type === ELEMENTS.STEAM && y === 0) {
            this.setCell(x, y, ELEMENTS.WATER);
            return true;
        }

        return false; // Клетка не исчезла, продолжаем расчет физики
    }

    processPhysics(x, y, type) {
        const props = PROPERTIES[type];
        const dir = Math.random() > 0.5 ? 1 : -1;

        if (props.isPowder) {
            this.movePowder(x, y, dir);
        } else if (props.isLiquid) {
            // Если жидкость падает в песок (просачивание)
            if (this.isElement(x, y + 1, ELEMENTS.SAND) && Math.random() < 0.1) {
                this.swap(x, y, x, y + 1);
            } else {
                this.moveLiquid(x, y, dir);
            }
        } else if (props.isGas) {
            this.moveGas(x, y, dir);
        }
    }

    movePowder(x, y, dir) {
        // Вниз -> по случайной диагонали -> по другой диагонали
        if (this.tryMove(x, y, 0, 1)) return;
        if (this.tryMove(x, y, dir, 1)) return;
        this.tryMove(x, y, -dir, 1);
    }

    moveLiquid(x, y, dir) {
        // Как сыпучее вещество, но с горизонтальным растеканием
        if (this.tryMove(x, y, 0, 1)) return;
        if (this.tryMove(x, y, dir, 1)) return;
        if (this.tryMove(x, y, -dir, 1)) return;
        if (this.tryMove(x, y, dir, 0)) return;
        this.tryMove(x, y, -dir, 0);
    }

    moveGas(x, y, dir) {
        if (Math.random() > 0.3) return; // Газы двигаются хаотично и медленнее
        
        // Вверх -> по диагоналям вверх -> в стороны
        if (this.tryMove(x, y, 0, -1)) return;
        if (this.tryMove(x, y, dir, -1)) return;
        if (this.tryMove(x, y, -dir, -1)) return;
        if (this.tryMove(x, y, dir, 0)) return;
        this.tryMove(x, y, -dir, 0);
    }
}