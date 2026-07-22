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
    // Создаем imageData один раз
    this.imageData = this.ctx.createImageData(this.width, this.height);
  }

  init() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.scale = this.baseScale;
    this.canvas.style.width = `${this.width * this.scale}px`;
    this.canvas.style.height = `${this.height * this.scale}px`;
  }

  draw(grid) {
    // 1. Быстро "обнуляем" весь массив imageData, делая все пиксели полностью прозрачными.
    // Это гораздо надежнее и быстрее, чем писать a=0 в цикле.
    this.imageData.data.fill(0);

    for (let i = 0; i < grid.length; i++) {
      const type = grid.types[i];

      // Пропускаем Воздух. Мы вообще не будем его рисовать!
      if (type === ELEMENTS.AIR) {
          continue; 
      }

      const color = COLORS[type];
      let r = color[0];
      let g = color[1];
      let b = color[2];
      let a = 255; // Все остальные элементы (песок, камень и т.д.) непрозрачные

      if (type === ELEMENTS.DIRT) {
        const moisture = grid.moisture[i];
        const darkenAmount = (moisture / 255) * 50; 
        
        r = Math.max(0, r - darkenAmount);
        g = Math.max(0, g - darkenAmount);
        b = Math.max(0, b - darkenAmount);
      }

      // --- ШЕЙДЕР ЖУКОВ (МЕРЦАНИЕ РОЯ) ---
      if (type === ELEMENTS.BUG) {
        const flicker = (Math.random() * 80) - 40; 
        r = Math.max(0, Math.min(255, r + flicker));
        g = Math.max(0, Math.min(255, g + flicker));
        b = Math.max(0, Math.min(255, b + flicker));
      }

      // --- ШЕЙДЕР РАЗНОЦВЕТНЫХ ЛЕПЕСТКОВ ---
      if (type === ELEMENTS.FLOWER_PETAL) {
        const colorIdx = grid.moisture[i];
        if (colorIdx === 1) { r = 255; g = 50;  b = 50; }       
        else if (colorIdx === 2) { r = 255; g = 215; b = 0; }   
        else if (colorIdx === 3) { r = 65;  g = 105; b = 225; } 
        else if (colorIdx === 4) { r = 148; g = 0;   b = 211; } 
      }

      const pixelIndex = i * 4;
      this.imageData.data[pixelIndex] = r;
      this.imageData.data[pixelIndex + 1] = g;
      this.imageData.data[pixelIndex + 2] = b;
      this.imageData.data[pixelIndex + 3] = a; 
    }
    
    // 2. Идеально очищаем сам Canvas браузера
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 3. Кладем картинку (где воздух 100% прозрачен) на очищенный холст
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}