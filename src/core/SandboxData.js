import { MAT } from './constants.js';

export class SandboxData {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Uint8Array(width * height);
        
        // НОВОЕ: Параллельный массив для дополнительных данных клетки (0-255)
        // Для дерева здесь будет храниться таймер выгорания.
        this.stateGrid = new Uint8Array(width * height);
        
        // НОВОЕ: Глобальная температура комнаты в градусах Цельсия
        this.roomTemperature = 22; 
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    setCell(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[this.getIndex(x, y)] = type;
        }
    }

    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[this.getIndex(x, y)];
        }
        // За границами экрана находится непробиваемая стена
        return MAT.STONE; 
    }

    swap(x1, y1, x2, y2) {
        const idx1 = this.getIndex(x1, y1);
        const idx2 = this.getIndex(x2, y2);
        const temp = this.grid[idx1];
        this.grid[idx1] = this.grid[idx2];
        this.grid[idx2] = temp;
    }

    getState(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.stateGrid[this.getIndex(x, y)];
        }
        return 0;
    }

    setState(x, y, value) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.stateGrid[this.getIndex(x, y)] = value;
        }
    }

}