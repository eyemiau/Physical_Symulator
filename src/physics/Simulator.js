import { MAT } from '../core/constants.js';

export class Simulator {
    constructor(sandbox) {
        this.sandbox = sandbox;
        this.tick = 0;
    }

    update() {
        this.tick++;
        const { width, height, grid } = this.sandbox;

        // Обход снизу вверх (чтобы избежать гравитационной телепортации)
        for (let y = height - 1; y >= 0; y--) {
            // МИКРО-ОПТИМИЗАЦИЯ 1: Кэшируем смещение строки
            // Избавляемся от умножения (y * width) внутри вложенного цикла
            const yOffset = y * width;
            
            // Меняем направление обхода по горизонтали каждый кадр
            const leftToRight = this.tick % 2 === 0;

            for (let i = 0; i < width; i++) {
                // Вычисляем X без ветвлений if/else внутри горячего цикла
                const x = leftToRight ? i : (width - 1 - i);
                
                // Читаем напрямую из массива, минуя вызов функции getCell ради скорости
                const cell = grid[yOffset + x];

                // ПАТТЕРН: Определение правил через Switch/Case
                switch (cell) {
                    case MAT.SAND:
                        this.updateSand(x, y);
                        break;
                    case MAT.WATER:
                        this.updateWater(x, y);
                        break;
                    // Воздух и Камень игнорируются, так как у них нет своей физики (они пассивны)
                }
            }
        }
    }

    updateSand(x, y) {
        const below = this.sandbox.getCell(x, y + 1);
        
        // КОЛЛИЗИЯ С ВОДОЙ: Песок тонет, вытесняя воду наверх (через swap)
        if (below === MAT.AIR || below === MAT.WATER) {
            this.sandbox.swap(x, y, x, y + 1);
        } else {
            // Проверка диагоналей
            const bl = this.sandbox.getCell(x - 1, y + 1);
            const br = this.sandbox.getCell(x + 1, y + 1);
            const canLeft = bl === MAT.AIR || bl === MAT.WATER;
            const canRight = br === MAT.AIR || br === MAT.WATER;

            if (canLeft && canRight) {
                // Псевдослучайный выбор для формирования симметричной кучи
                this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (canLeft) {
                this.sandbox.swap(x, y, x - 1, y + 1);
            } else if (canRight) {
                this.sandbox.swap(x, y, x + 1, y + 1);
            }
        }
    }

    updateWater(x, y) {
        const below = this.sandbox.getCell(x, y + 1);
        
        if (below === MAT.AIR) {
            this.sandbox.swap(x, y, x, y + 1);
        } else {
            const bl = this.sandbox.getCell(x - 1, y + 1);
            const br = this.sandbox.getCell(x + 1, y + 1);
            const canLeft = bl === MAT.AIR;
            const canRight = br === MAT.AIR;

            if (canLeft && canRight) {
                this.sandbox.swap(x, y, Math.random() > 0.5 ? x - 1 : x + 1, y + 1);
            } else if (canLeft) {
                this.sandbox.swap(x, y, x - 1, y + 1);
            } else if (canRight) {
                this.sandbox.swap(x, y, x + 1, y + 1);
            } else {
                // Если нельзя вниз или по диагонали — течем вбок
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
}