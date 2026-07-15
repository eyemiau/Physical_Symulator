import { COLORS } from './elements.js';

export class Renderer {
    constructor(config) {
        this.canvas = document.getElementById(config.CANVAS_ID);
        this.ctx = this.canvas.getContext('2d');
        this.width = config.GRID_WIDTH;
        this.height = config.GRID_HEIGHT;
        this.scale = config.SCALE;
       
        this.init();
        this.imageData = this.ctx.createImageData(this.width, this.height);
    }

    init() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${this.width * this.scale}px`;
        this.canvas.style.height = `${this.height * this.scale}px`;
    }

    draw(grid) {
        for (let i = 0; i < grid.length; i++) {
            const type = grid.types[i];
            const color = COLORS[type];

            const pixelIndex = i * 4;

            this.imageData.data[pixelIndex] = color[0];     // Red
            this.imageData.data[pixelIndex + 1] = color[1]; // Green
            this.imageData.data[pixelIndex + 2] = color[2]; // Blue
            this.imageData.data[pixelIndex + 3] = 255;      // Alpha (255 = полностью непрозрачный)
        }

        // Отрисовываем весь буфер на холст за один раз
        this.ctx.putImageData(this.imageData, 0, 0);
    }    
}