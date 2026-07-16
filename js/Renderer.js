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
      
      // Инициализируем базовый цвет
      let r = color[0];
      let g = color[1];
      let b = color[2];

      // --- НАШ МИНИ-ШЕЙДЕР ВЛАЖНОСТИ ---
      // Если это Почва, мы динамически затемняем её на основе массива moisture
      if (type === ELEMENTS.DIRT) {
        const moisture = grid.moisture[i]; // Значение от 0 до 255
        
        // Вычисляем коэффициент затемнения. 
        // При максимальной влажности (255) мы отнимем 50 единиц яркости от каждого канала
        const darkenAmount = (moisture / 255) * 50; 
        
        // Math.max(0, ...) спасает нас от отрицательных значений RGB
        r = Math.max(0, r - darkenAmount);
        g = Math.max(0, g - darkenAmount);
        b = Math.max(0, b - darkenAmount);
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