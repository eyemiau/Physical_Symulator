import { MAT } from '../core/constants.js';

export class Simulator {
    constructor(sandbox) {
        this.sandbox = sandbox;
        this.tick = 0;
    }

    hasNeighbor(x, y, material) {
        return this.sandbox.getCell(x, y - 1) === material ||
               this.sandbox.getCell(x, y + 1) === material ||
               this.sandbox.getCell(x - 1, y) === material ||
               this.sandbox.getCell(x + 1, y) === material;
    }

    update() {
        this.tick++;
        const { width, height } = this.sandbox;
        
        // Оптимизация: меняем направление по X, чтобы кучи были симметричными
        const leftToRight = this.tick % 2 === 0;

        // ПАСС 1: СНИЗУ ВВЕРХ (Гравитация)
        // Обрабатываем только тяжелые элементы, которые падают
        for (let y = height - 1; y >= 0; y--) {
            for (let i = 0; i < width; i++) {
                const x = leftToRight ? i : (width - 1 - i);
                const cell = this.sandbox.getCell(x, y);

                if (cell === MAT.SAND) this.updateSand(x, y);
                else if (cell === MAT.WATER) this.updateLiquid(x, y, false);
                else if (cell === MAT.SOLUTION) this.updateLiquid(x, y, true);
            }
        }

        // ПАСС 2: СВЕРХУ ВНИЗ (Анти-гравитация)
        // Обрабатываем только легкие элементы, которые летят вверх
        for (let y = 0; y < height; y++) {
            for (let i = 0; i < width; i++) {
                const x = leftToRight ? i : (width - 1 - i);
                const cell = this.sandbox.getCell(x, y);

                if (cell === MAT.STEAM) this.updateSteam(x, y);
                else if (cell === MAT.FIRE) this.updateFire(x, y);
            }
        }
    }

    updateSand(x, y) {
        const below = this.sandbox.getCell(x, y + 1);
        
        // Песок теперь падает сквозь воздух и ТОНЕТ в воде
        if (below === MAT.AIR || below === MAT.WATER) {
            this.sandbox.swap(x, y, x, y + 1);
        } else {
            const bl = this.sandbox.getCell(x - 1, y + 1);
            const br = this.sandbox.getCell(x + 1, y + 1);
            const canLeft = bl === MAT.AIR || bl === MAT.WATER;
            const canRight = br === MAT.AIR || br === MAT.WATER;

            if (canLeft && canRight) {
                this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (canLeft) {
                this.sandbox.swap(x, y, x - 1, y + 1);
            } else if (canRight) {
                this.sandbox.swap(x, y, x + 1, y + 1);
            }
        }
    }

    // НОВОЕ: Логика текучести воды
    updateLiquid(x, y, isSolution) {
        // --- 1. ИСПАРЕНИЕ ---
        if (this.sandbox.roomTemperature >= 100 || this.hasNeighbor(x, y, MAT.FIRE)) {
            if (isSolution) {
                this.sandbox.setCell(x, y, MAT.CRYSTAL); 
            } else {
                this.sandbox.setCell(x, y, MAT.STEAM);
            }
            return;
        }

        // --- 2. ЭРОЗИЯ (Только для Воды) ---
        if (!isSolution && Math.random() < 0.05) {
            const neighbors = [{dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
            for (let n of neighbors) {
                if (this.sandbox.getCell(x + n.dx, y + n.dy) === MAT.SAND) {
                    this.sandbox.swap(x, y, x + n.dx, y + n.dy);
                    return; 
                }
            }
        }

        // --- 3. РАСТВОРЕНИЕ МИНЕРАЛОВ ---
        if (!isSolution && this.hasNeighbor(x, y, MAT.MINERAL)) {
            if (this.sandbox.getCell(x, y+1) === MAT.MINERAL) this.sandbox.setCell(x, y+1, MAT.AIR);
            else if (this.sandbox.getCell(x, y-1) === MAT.MINERAL) this.sandbox.setCell(x, y-1, MAT.AIR);
            else if (this.sandbox.getCell(x+1, y) === MAT.MINERAL) this.sandbox.setCell(x+1, y, MAT.AIR);
            else if (this.sandbox.getCell(x-1, y) === MAT.MINERAL) this.sandbox.setCell(x-1, y, MAT.AIR);
            
            this.sandbox.setCell(x, y, MAT.SOLUTION);
            return;
        }

        // --- 4. ТЕКУЧЕСТЬ (Исправленная) ---
        const below = this.sandbox.getCell(x, y + 1);
        
        // Падение вниз
        if (below === MAT.AIR) {
            this.sandbox.swap(x, y, x, y + 1);
        } else {
            const bl = this.sandbox.getCell(x - 1, y + 1);
            const br = this.sandbox.getCell(x + 1, y + 1);
            const canLeft = bl === MAT.AIR;
            const canRight = br === MAT.AIR;

            // Стекание по диагонали
            if (canLeft && canRight) {
                this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (canLeft) {
                this.sandbox.swap(x, y, x - 1, y + 1);
            } else if (canRight) {
                this.sandbox.swap(x, y, x + 1, y + 1);
            } else {
                // Растекание по горизонтали, если дно плоское
                const left = this.sandbox.getCell(x - 1, y);
                const right = this.sandbox.getCell(x + 1, y);
                const moveLeft = left === MAT.AIR;
                const moveRight = right === MAT.AIR;

                if (moveLeft && moveRight) {
                    this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y);
                } else if (moveLeft) {
                    this.sandbox.swap(x, y, x - 1, y);
                } else if (moveRight) {
                    this.sandbox.swap(x, y, x + 1, y);
                }
            }
        }
    }

    updateFire(x, y) {
        // Огонь живет недолго. С шансом 10% он исчезает каждый кадр,
        // либо летит вверх, как пламя.
        if (Math.random() < 0.1) {
            this.sandbox.setCell(x, y, MAT.AIR);
        } else if (this.sandbox.getCell(x, y - 1) === MAT.AIR) {
             // Пламя иногда "пляшет" влево/вправо
             const dx = Math.random() > 0.5 ? -1 : 1;
             this.sandbox.swap(x, y, x + dx, y - 1);
        }
    }

    // НОВЫЙ МЕТОД ДЛЯ ПАРА
    updateSteam(x, y) {
        if (this.sandbox.roomTemperature < 100) {
            // Пар превращается в воду на потолке или случайно в полете (шанс 0.5% за кадр)
            if (y === 0 || Math.random() < 0.005) { 
                this.sandbox.setCell(x, y, MAT.WATER);
                return;
            }
        } else {
            // Если комната кипит (>100 градусов), пар не конденсируется, 
            // а просто улетучивается (исчезает), коснувшись потолка
            if (y === 0) {
                this.sandbox.setCell(x, y, MAT.AIR);
                return;
            }
        }
        // Гравитация наоборот: смотрим, что находится НАД нами
        const above = this.sandbox.getCell(x, y - 1);
        
        if (above === MAT.AIR) {
            this.sandbox.swap(x, y, x, y - 1);
        } else {
            // Пар пытается обойти преграды по диагонали ВВЕРХ
            const tl = this.sandbox.getCell(x - 1, y - 1);
            const tr = this.sandbox.getCell(x + 1, y - 1);

            if (tl === MAT.AIR && tr === MAT.AIR) {
                this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y - 1);
            } else if (tl === MAT.AIR) {
                this.sandbox.swap(x, y, x - 1, y - 1);
            } else if (tr === MAT.AIR) {
                this.sandbox.swap(x, y, x + 1, y - 1);
            } else {
                // Растекается по потолку влево-вправо
                const left = this.sandbox.getCell(x - 1, y);
                const right = this.sandbox.getCell(x + 1, y);
                
                if (left === MAT.AIR && right === MAT.AIR) {
                    this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y);
                } else if (left === MAT.AIR) {
                    this.sandbox.swap(x, y, x - 1, y);
                } else if (right === MAT.AIR) {
                    this.sandbox.swap(x, y, x + 1, y);
                }
            }
        }
    }
}