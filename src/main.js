import { SandboxData } from './core/SandboxData.js';
import { CanvasRenderer } from './render/CanvasRenderer.js';
import { Simulator } from './physics/Simulator.js';
import { MAT } from './core/constants.js';

class Engine {
    constructor() {
        const width = 200;
        const height = 150;
        
        this.sandbox = new SandboxData(width, height);
        this.simulator = new Simulator(this.sandbox);
        
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new CanvasRenderer(canvas, width, height);
        
        this.isRunning = false;
        this.loop = this.loop.bind(this);

        // Настройки кисти
        this.isDrawing = false;
        this.currentMaterial = MAT.SAND;

        this.setupInputs(canvas);

        // Рисуем базовую платформу
        for(let i = 50; i < 150; i++) {
            this.sandbox.setCell(i, 100, MAT.STONE);
        }
    }

    setupInputs(canvas) {
        canvas.addEventListener('mousedown', () => this.isDrawing = true);
        window.addEventListener('mouseup', () => this.isDrawing = false);
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            
            // Вычисляем координаты клика с учетом CSS-масштабирования Canvas
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.floor((e.clientX - rect.left) * scaleX);
            const y = Math.floor((e.clientY - rect.top) * scaleY);
            
            // Рисуем круглой "кистью"
            for(let dy = -2; dy <= 2; dy++) {
                for(let dx = -2; dx <= 2; dx++) {
                    if (dx*dx + dy*dy <= 4) { // Формула круга
                        // Добавляем немного случайности для естественности (кроме ластика и камня)
                        if (this.currentMaterial === MAT.AIR || this.currentMaterial === MAT.STONE || Math.random() > 0.5) {
                            this.sandbox.setCell(x + dx, y + dy, this.currentMaterial);
                        }
                    }
                }
            }
        });

        // Переключение материалов цифрами на клавиатуре
        window.addEventListener('keydown', (e) => {
            if (e.key === '1') this.currentMaterial = MAT.SAND;
            if (e.key === '2') this.currentMaterial = MAT.WATER;
            if (e.key === '3') this.currentMaterial = MAT.STONE;
            if (e.key === '4') this.currentMaterial = MAT.MINERAL;
            if (e.key === '5') this.currentMaterial = MAT.FIRE;
            if (e.key === '0') this.currentMaterial = MAT.AIR;
        });

        const tempSlider = document.getElementById('tempSlider');
        const tempValue = document.getElementById('tempValue');

        // Используем событие 'input' для мгновенной реакции
        tempSlider.addEventListener('input', (e) => {
            // e.target.value всегда возвращает строку, поэтому переводим ее в целое число (Integer)
            const newTemp = parseInt(e.target.value, 10);
            
            // Обновляем данные в симуляции
            this.sandbox.roomTemperature = newTemp;
            
            // Обновляем текст на экране, чтобы игрок видел точную цифру
            tempValue.innerText = newTemp;
        });       
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        requestAnimationFrame(this.loop);
    }

    loop() {
        if (!this.isRunning) return;

        this.simulator.update();
        this.renderer.draw(this.sandbox);

        requestAnimationFrame(this.loop);
    }
}

const engine = new Engine();
engine.start();