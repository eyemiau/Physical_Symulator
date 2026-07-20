import { COLORS, ELEMENTS } from "./elements.js";

export class Renderer {
  constructor(config) {
    this.canvas = document.getElementById(config.CANVAS_ID);
    this.ctx = this.canvas.getContext("2d");
    this.width = config.GRID_WIDTH;
    this.height = config.GRID_HEIGHT;
    this.baseScale = config.SCALE;
    this.scale = config.SCALE;
    this.toolbar = document.querySelector(".toolbar");

    this.init();
    this.imageData = this.ctx.createImageData(this.width, this.height);

    window.addEventListener("resize", () => this.init());
  }

  init() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const toolbarHeight = this.toolbar ? this.toolbar.offsetHeight : 0;
    const gap = 15;
    const padding = 40;

    const availWidth = window.innerWidth - padding;
    const availHeight = window.innerHeight - toolbarHeight - gap - padding;

    const scaleByWidth = availWidth / this.width;
    const scaleByHeight = availHeight / this.height;

    this.scale = Math.max(
      1,
      Math.min(this.baseScale, scaleByWidth, scaleByHeight),
    );

    this.canvas.style.width = `${this.width * this.scale}px`;
    this.canvas.style.height = `${this.height * this.scale}px`;
  }

    draw(grid) {
    for (let i = 0; i < grid.length; i++) {
      const type = grid.types[i];
      const color = COLORS[type];
      
      let r = color[0];
      let g = color[1];
      let b = color[2];

      if (type === ELEMENTS.DIRT) {
        const moisture = grid.moisture[i];
        const darkenAmount = (moisture / 255) * 50; 
        
        r = Math.max(0, r - darkenAmount);
        g = Math.max(0, g - darkenAmount);
        b = Math.max(0, b - darkenAmount);
      }

      // --- ШЕЙДЕР ЖУКОВ (МЕРЦАНИЕ РОЯ) ---
      if (type === ELEMENTS.BUG) {
        // Добавляем случайное пульсирующее отклонение цвета для создания эффекта "живого роя"
        const flicker = (Math.random() * 80) - 40; 
        r = Math.max(0, Math.min(255, r + flicker));
        g = Math.max(0, Math.min(255, g + flicker));
        b = Math.max(0, Math.min(255, b + flicker));
      }

      // --- ШЕЙДЕР РАЗНОЦВЕТНЫХ ЛЕПЕСТКОВ ---
      if (type === ELEMENTS.FLOWER_PETAL) {
        const colorIdx = grid.moisture[i];
        if (colorIdx === 1) { r = 255; g = 50;  b = 50; }       // Красный
        else if (colorIdx === 2) { r = 255; g = 215; b = 0; }   // Желтый
        else if (colorIdx === 3) { r = 65;  g = 105; b = 225; } // Синий
        else if (colorIdx === 4) { r = 148; g = 0;   b = 211; } // Фиолетовый
      }

      const pixelIndex = i * 4;
      this.imageData.data[pixelIndex] = r;
      this.imageData.data[pixelIndex + 1] = g;
      this.imageData.data[pixelIndex + 2] = b;
      this.imageData.data[pixelIndex + 3] = 255;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}