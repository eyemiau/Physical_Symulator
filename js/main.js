import { CONFIG } from './config.js';
import { Renderer } from './Renderer.js';
import { Grid } from './Grid.js';
import { ELEMENTS, COLORS, PROPERTIES } from './elements.js';
import { audioManager } from './AudioManager.js';

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

let lastBlockSoundTime = 0; 

function drawCell(e) {
    if (!isDrawing) return;
    const rect = renderer.canvas.getBoundingClientRect();
    const scaleX = renderer.canvas.width / rect.width;
    const scaleY = renderer.canvas.height / rect.height;

    const mouseX = Math.floor((e.clientX - rect.left) * scaleX);
    const mouseY = Math.floor((e.clientY - rect.top) * scaleY);

    let placedSolid = false; 

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const cx = mouseX + i;
            const cy = mouseY + j;
            
            if (grid.getCell(cx, cy) !== currentElement) {
                grid.setCell(cx, cy, currentElement);
                
                const props = PROPERTIES[currentElement] || {};
                if (currentElement !== ELEMENTS.AIR && !props.isPowder && !props.isLiquid && !props.isGas) {
                    placedSolid = true;
                }
            }
        }
    }

    const now = performance.now();
    if (placedSolid && (now - lastBlockSoundTime > 150)) {
        audioManager.playOneShot('PLACE_BLOCK');
        lastBlockSoundTime = now;
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
    audioManager.playQueuedSounds(); // Проигрываем накопленные за кадр звуки
    renderer.draw(grid);
    requestAnimationFrame(gameLoop);
}

// --- АУДИО И МУЗЫКА ---
const bgMusic = document.getElementById('bg-music');
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
let audioContextStarted = false;

// Инициализация громкости
bgMusic.volume = musicVolumeSlider.value;
audioManager.setMasterVolume(sfxVolumeSlider.value);

// Слушатели ползунков
musicVolumeSlider.addEventListener('input', (e) => bgMusic.volume = e.target.value);
sfxVolumeSlider.addEventListener('input', (e) => audioManager.setMasterVolume(e.target.value));

// Запуск аудио контекста по первому клику
document.body.addEventListener('mousedown', () => {
    if (!audioContextStarted) {
        bgMusic.play();
        if (audioManager.ctx.state === 'suspended') {
            audioManager.ctx.resume();
        }
        audioContextStarted = true;
    }
});

gameLoop();