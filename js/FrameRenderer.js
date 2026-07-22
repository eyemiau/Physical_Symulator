export class FrameRenderer {
  constructor(config) {
    this.frameCanvas = document.getElementById("frameCanvas");
    this.gameCanvas = document.getElementById(config.CANVAS_ID);
    this.ctx = this.frameCanvas.getContext("2d");

    // Размеры игры
    this.gameWidth = config.GRID_WIDTH * config.SCALE;
    this.gameHeight = config.GRID_HEIGHT * config.SCALE;
    this.scale = config.SCALE;

    // Оставляем те самые настройки, к которым вы откатились
    this.pBorderTop = 22;
    this.pBorderBottom = 4;
    this.pBorderLeft = 4;
    this.pBorderRight = 4;

    this.init();
  }

  init() {
    const gamePWidth = this.gameWidth / this.scale;
    const gamePHeight = this.gameHeight / this.scale;

    this.totalPWidth = gamePWidth + this.pBorderLeft + this.pBorderRight;
    this.totalPHeight = gamePHeight + this.pBorderTop + this.pBorderBottom;

    this.frameWidth = this.totalPWidth * this.scale;
    this.frameHeight = this.totalPHeight * this.scale;

    const wrapper = document.getElementById("jar-wrapper");
    wrapper.style.width = `${this.frameWidth}px`;
    wrapper.style.height = `${this.frameHeight}px`;

    // Игровой холст сдвигается вниз на 22 виртуальных пикселя
    this.gameCanvas.style.top = `${this.pBorderTop * this.scale}px`;
    this.gameCanvas.style.left = `${this.pBorderLeft * this.scale}px`;

    this.setupRetinaCanvas();
    this.drawJar();
  }

  setupRetinaCanvas() {
    const dpr = window.devicePixelRatio || 1;

    this.frameCanvas.width = this.frameWidth * dpr;
    this.frameCanvas.height = this.frameHeight * dpr;
    this.frameCanvas.style.width = `${this.frameWidth}px`;
    this.frameCanvas.style.height = `${this.frameHeight}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  drawPixel(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
  }

  drawJar() {
    this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);

    const w = this.totalPWidth;
    const h = this.totalPHeight;

    const cBorder = "#ffffff";
    const cHigh = "#f2f2f2";
    const cGlassL = "#d1d1d1";
    const cGlassM = "#a3a3a3";
    const cGlassD = "#5c5c5c";

    const corkLight = "#d6a26d";
    const corkMid = "#b07b46";
    const corkDark = "#82552a";
    const corkOut = "#543314";

    // 1. ПРОБКА
    for (let y = 0; y <= 4; y++) {
      let startX = y === 0 ? 13 : 12;
      let endX = y === 0 ? w - 13 : w - 12;
      for (let x = startX; x < endX; x++) {
        let col = corkMid;
        if (y === 0 || x === startX || x === endX - 1) col = corkOut;
        else if (x < startX + 3) col = corkLight;
        else if (x > endX - 4) col = corkDark;
        else if ((x + y) % 3 === 0) col = corkDark;
        this.drawPixel(x, y, col);
      }
    }

    const drawRimRow = (y, startX, endX) => {
      for (let x = startX; x < endX; x++) {
        let col = cGlassM;
        if (
          y === 5 ||
          y === 7 ||
          y === 14 ||
          y === 16 ||
          x === startX ||
          x === endX - 1
        )
          col = cBorder;
        else {
          if (x === startX + 1) col = cHigh;
          else if (x < startX + 4) col = cGlassL;
          else if (x > endX - 4) col = cGlassD;
        }
        this.drawPixel(x, y, col);
      }
    };

    // 2. ВЕРХНИЙ ОБОДОК
    drawRimRow(5, 9, w - 9);
    drawRimRow(6, 8, w - 8);
    drawRimRow(7, 9, w - 9);

    // 3. ТРУБКА ГОРЛЫШКА
    for (let y = 8; y <= 13; y++) {
      this.drawPixel(10, y, cBorder);
      this.drawPixel(11, y, cGlassM);
      this.drawPixel(12, y, cGlassL);
      this.drawPixel(13, y, cBorder);

      this.drawPixel(w - 14, y, cBorder);
      this.drawPixel(w - 13, y, cGlassD);
      this.drawPixel(w - 12, y, cGlassM);
      this.drawPixel(w - 11, y, cBorder);
    }

    // 4. НИЖНИЙ ОБОДОК
    drawRimRow(14, 8, w - 8);
    drawRimRow(15, 7, w - 7);
    drawRimRow(16, 8, w - 8);

         // Вспомогательная функция для плавного смешивания двух HEX-цветов
    const lerpColor = (c1, c2, t) => {
        // Конвертируем HEX в RGB
        const r1 = parseInt(c1.substring(1, 3), 16);
        const g1 = parseInt(c1.substring(3, 5), 16);
        const b1 = parseInt(c1.substring(5, 7), 16);
        
        const r2 = parseInt(c2.substring(1, 3), 16);
        const g2 = parseInt(c2.substring(3, 5), 16);
        const b2 = parseInt(c2.substring(5, 7), 16);

        // Смешиваем (t от 0 до 1)
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return `rgb(${r},${g},${b})`;
    };

        // 5. ПЛЕЧИ БАНКИ - ПЛАВНЫЙ ГРАДИЕНТ (ПРИГЛУШЕННЫЙ БЛИК)
    const drawShoulderRow = (y, lx, rx) => {
      this.drawPixel(lx, y, cBorder);
      this.drawPixel(lx + 1, y, cGlassM);
      this.drawPixel(lx + 2, y, cGlassL);
      this.drawPixel(lx + 3, y, cBorder);

      this.drawPixel(rx - 4, y, cBorder);
      this.drawPixel(rx - 3, y, cGlassD);
      this.drawPixel(rx - 2, y, cGlassM);
      this.drawPixel(rx - 1, y, cBorder);

      // --- ВНУТРЕННИЙ МАССИВ СТЕКЛА ---
      if (y < 21) {
        let innerWidth = rx - 5 - (lx + 4);

        for (let x = lx + 4; x <= rx - 5; x++) {
          let progress = (x - (lx + 4)) / innerWidth;
          let col;

          if (x === lx + 4) {
            // ОДИН единственный пиксель белого цвета для обозначения острого края стекла
            col = cBorder;
          } else if (progress < 0.5) {
            // Основная левая и центральная часть: очень мягкий переход от светло-серого к серому
            // Обратите внимание: мы начинаем с cGlassL (светло-серый), а не с белого!
            let t = progress / 0.5;
            col = lerpColor(cGlassL, cGlassM, t);
          } else {
            // Правая часть: уход из серого в тень
            let t = (progress - 0.5) / 0.5;
            col = lerpColor(cGlassM, cGlassD, t);
          }

          this.drawPixel(x, y, col);
        }
      } else {
        // Y = 21: Потолок
        for (let x = lx + 4; x <= rx - 5; x++) {
          let col = cBorder;
          if (x === lx + 4 || x === lx + 5) col = cGlassL;
          if (x >= rx - 7) col = cGlassD;
          this.drawPixel(x, y, col);
        }
      }
    };;


    // Внешний силуэт остается таким же диагональным
    drawShoulderRow(17, 7, w - 7);
    drawShoulderRow(18, 5, w - 5);
    drawShoulderRow(19, 3, w - 3);
    drawShoulderRow(20, 1, w - 1);
    drawShoulderRow(21, 0, w); // На Y=21 рисуется плоский потолок

    // 6. ОСНОВНЫЕ ПРЯМЫЕ СТЕНКИ (С Y=22 начинается gameCanvas!)
    for (let y = 22; y <= h - 5; y++) {
      this.drawPixel(0, y, cBorder);
      this.drawPixel(1, y, cGlassM);
      let highlightCol = y % 4 === 0 || y % 5 === 0 ? cHigh : cGlassL;
      this.drawPixel(2, y, highlightCol);
      this.drawPixel(3, y, cBorder);

      this.drawPixel(w - 4, y, cBorder);
      let shadowCol = y % 2 === 0 ? cGlassD : cGlassM;
      this.drawPixel(w - 3, y, cGlassD);
      this.drawPixel(w - 2, y, shadowCol);
      this.drawPixel(w - 1, y, cBorder);
    }

    // 7. ЗАКРУГЛЕННЫЕ УГЛЫ И ТОЛСТОЕ ДНО
    this.drawPixel(1, h - 4, cBorder);
    this.drawPixel(2, h - 4, cGlassM);
    this.drawPixel(3, h - 4, cGlassL);
    this.drawPixel(w - 4, h - 4, cGlassM);
    this.drawPixel(w - 3, h - 4, cGlassD);
    this.drawPixel(w - 2, h - 4, cBorder);
    for (let x = 4; x <= w - 5; x++) this.drawPixel(x, h - 4, cBorder);

    this.drawPixel(2, h - 3, cBorder);
    this.drawPixel(3, h - 3, cGlassM);
    this.drawPixel(w - 4, h - 3, cGlassD);
    this.drawPixel(w - 3, h - 3, cBorder);
    for (let x = 4; x <= w - 5; x++) this.drawPixel(x, h - 3, cGlassM);

    this.drawPixel(3, h - 2, cBorder);
    this.drawPixel(w - 4, h - 2, cBorder);
    for (let x = 4; x <= w - 5; x++) this.drawPixel(x, h - 2, cGlassL);

    for (let x = 4; x <= w - 5; x++) this.drawPixel(x, h - 1, cBorder);
  }
}
