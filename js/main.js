import { CONFIG } from './config.js';
import { Renderer } from './Renderer.js';
import { Grid } from './Grid.js';
import { ELEMENTS, COLORS } from './elements.js';

const renderer = new Renderer(CONFIG);
const grid = new Grid(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);

for (let x = 0; x < grid.width; x++) {
    for (let y = grid.height - 10; y < grid.height; y++) {
        grid.setCell(x, y, ELEMENTS.STONE);
    }
}

// --- УПРАВЛЕНИЕ КИСТЬЮ ---
let currentElement = ELEMENTS.SAND; // Элемент по умолчанию
let isDrawing = false; // Зажата ли кнопка мыши

// 1. Создаем кнопки палитры
const toolbar = document.querySelector('.toolbar');
for (const [key, value] of Object.entries(ELEMENTS)) {
    const btn = document.createElement('button');
    btn.className = 'element-btn';
    btn.textContent = key;
    
    // Получаем цвет элемента для фона кнопки
    const color = COLORS[value];
    btn.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    
    // Если это первый элемент, делаем его активным визуально
    if (value === currentElement) btn.classList.add('active');

    btn.addEventListener('click', () => {
        currentElement = value;
        // Убираем класс active у всех кнопок и добавляем текущей
        document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });

    toolbar.appendChild(btn);
}

// --- УПРАВЛЕНИЕ ТЕМПЕРАТУРОЙ ---
const tempSlider = document.getElementById('tempSlider');
const tempValueDisplay = document.getElementById('tempValue');

// Событие 'input' срабатывает каждый раз, когда мы двигаем ползунок
tempSlider.addEventListener('input', (e) => {
    const newTemp = parseInt(e.target.value); 
    tempValueDisplay.textContent = newTemp;
    grid.temperature = newTemp;
});

// --- УПРАВЛЕНИЕ МЫШЬЮ (МОМЕНТАЛЬНОЕ РИСОВАНИЕ) ---

function drawCell(e) {
    if (!isDrawing) return;
    const rect = renderer.canvas.getBoundingClientRect();
    const scaleX = renderer.canvas.width / rect.width;
    const scaleY = renderer.canvas.height / rect.height;

    const mouseX = Math.floor((e.clientX - rect.left) * scaleX);
    const mouseY = Math.floor((e.clientY - rect.top) * scaleY);

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            grid.setCell(mouseX + i, mouseY + j, currentElement);
        }
    }
}

renderer.canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    drawCell(e); 
});
renderer.canvas.addEventListener('mousemove', drawCell);
window.addEventListener('mouseup', () => isDrawing = false);
renderer.canvas.addEventListener('mouseleave', () => isDrawing = false);

// --- ИГРОВОЙ ЦИКЛ ---
function gameLoop() {
    grid.update();
    renderer.draw(grid);
    requestAnimationFrame(gameLoop);
}

gameLoop();