import { MAT } from '../core/constants.js';

// Палитра цветов в формате [R, G, B, A] (255 - полная непрозрачность)
const COLORS = {
    [MAT.AIR]: [20, 20, 20, 255],
    [MAT.STONE]: [120, 120, 120, 255],
    [MAT.SAND]: [230, 200, 110, 255],
    [MAT.MINERAL]: [220, 100, 220, 255], 
    [MAT.WATER]: [40, 120, 255, 255],
    [MAT.STEAM]: [200, 200, 220, 150],
    [MAT.SOLUTION]: [130, 60, 255, 255], 
    [MAT.CRYSTAL]: [100, 255, 255, 255],
    [MAT.FIRE]: [255, 80, 0, 255] // Оранжево-красный
};

export class CanvasRenderer {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.canvas.width = width;
        this.canvas.height = height;

        // Создаем объект ImageData, который содержит сырой массив пикселей
        this.imageData = this.ctx.createImageData(width, height);
        
        // Главный секрет оптимизации: мы смотрим на буфер памяти (Uint8ClampedArray)
        // через "линзу" Uint32Array. Это позволяет писать сразу 4 байта (один целый пиксель) 
        // за одну процессорную инструкцию.
        this.buf32 = new Uint32Array(this.imageData.data.buffer);
        
        // Предварительно конвертируем нашу палитру в 32-битные числа (Little-Endian формат)
        this.colorPalette = new Uint32Array(Object.keys(COLORS).length);
        for (let mat in COLORS) {
            const [r, g, b, a] = COLORS[mat];
            // Побитовый сдвиг упаковывает RGBA в один Integer
            this.colorPalette[mat] = (a << 24) | (b << 16) | (g << 8) | r;
        }
    }

    draw(sandbox) {
        const grid = sandbox.grid;
        const length = grid.length;

        // Линейный проход по памяти кэша: O(N).
        // Мы берем тип материала и переносим его цвет в буфер экрана.
        for (let i = 0; i < length; i++) {
            const materialType = grid[i];
            this.buf32[i] = this.colorPalette[materialType];
        }

        // Выгружаем готовый кадр на экран (один вызов GPU вместо 30 000)
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}