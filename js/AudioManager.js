import { ELEMENTS } from './elements.js';

export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this.noiseBuffer = this.createWhiteNoise();
        this.fileBuffers = {}; // Сюда загрузим MP3
        this.frameEvents = {};

        // ЗАЦИКЛЕННЫЕ ЗВУКИ
        this.soundProfiles = {
            // Твои MP3 файлы (теперь тут и кислота с раствором):
            [ELEMENTS.WATER]: { baseVolume: 0.05, type: 'file', url: 'audio/soundreality-water-stream-river-360596.mp3', playbackRate: 1.0 },
            [ELEMENTS.LAVA]: { baseVolume: 0.8, type: 'file', url: 'audio/freesound_community-lava-loop-3-28887.mp3', playbackRate: 1.0 },
            [ELEMENTS.SALT_WATER]: { baseVolume: 0.06, type: 'file', url: 'audio/soundreality-water-stream-river-360596.mp3', playbackRate: 1.0 },
            [ELEMENTS.ACID]: { baseVolume: 0.04, type: 'file', url: 'audio/soundreality-water-stream-river-360596.mp3', playbackRate: 0.9 },
            [ELEMENTS.SOLUTION]: { baseVolume: 0.03, type: 'file', url: 'audio/soundreality-water-stream-river-360596.mp3', playbackRate: 0.8 },
            [ELEMENTS.OIL]: { baseVolume: 0.02, type: 'file', url: 'audio/soundreality-water-stream-river-360596.mp3', playbackRate: 0.7 },
        
            // Шум:
            [ELEMENTS.SAND]: { baseVolume: 0.07, type: 'noise', filterType: 'highpass', freq: 300 }, 
            [ELEMENTS.BUG]: { baseVolume: 0.35, type: 'noise', filterType: 'lowpass', freq: 300 },   
            [ELEMENTS.DIRT]: { baseVolume: 0.2, type: 'noise', filterType: 'bandpass', freq: 600 },
            [ELEMENTS.ASH]: { baseVolume: 0.08, type: 'noise', filterType: 'highpass', freq: 1500 },
            [ELEMENTS.GUNPOWDER]: { baseVolume: 0.1, type: 'noise', filterType: 'bandpass', freq: 800 },
            [ELEMENTS.SALT]: { baseVolume: 0.08, type: 'noise', filterType: 'highpass', freq: 4000 },
            [ELEMENTS.STEAM]: { baseVolume: 1, type: 'noise', filterType: 'bandpass', freq: 5000 }, 
            [ELEMENTS.SEED]: { baseVolume: 0.1, type: 'noise', filterType: 'highpass', freq: 1500 },
            [ELEMENTS.FLOWER_SEED]: { baseVolume: 0.1, type: 'noise', filterType: 'highpass', freq: 1500 }
        };

        // В блоке this.soundProfiles добавь масло (можно куда-нибудь к остальным шумам):


        // В блоке this.oneShotProfiles добавь бульканье:
        this.oneShotProfiles = {
            'PLACE_BLOCK': { baseVolume: 3.5, filterType: 'lowpass', freq: 150, duration: 0.1 }, 
            'EVAPORATE': { baseVolume: 1.0, filterType: 'highpass', freq: 4000, duration: 0.4 },
            'EXPLOSION': { baseVolume: 60.0, filterType: 'lowpass', freq: 100, duration: 1.5 },
            
             };

        this.channels = {}; 
        this.isInitialized = false;
        
        // Запускаем асинхронную загрузку файлов сразу при создании
        this.loadExternalSounds();
    }

    createWhiteNoise() {
        const bufferSize = this.ctx.sampleRate * 2; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; 
        }
        return buffer;
    }

    async loadExternalSounds() {
        for (const [keyStr, profile] of Object.entries(this.soundProfiles)) {
            if (profile.type === 'file') {
                try {
                    const response = await fetch(profile.url);
                    const arrayBuffer = await response.arrayBuffer();
                    this.fileBuffers[keyStr] = await this.ctx.decodeAudioData(arrayBuffer);
                    
                    // Если звук инициализировался позже первого клика — сразу подключаем его
                    if (this.isInitialized && !this.channels[keyStr]) {
                        this.setupChannel(keyStr, profile);
                    }
                } catch (e) {
                    console.error("Ошибка загрузки звука:", profile.url, e);
                }
            }
        }
    }

    setupChannel(keyStr, profile) {
        const source = this.ctx.createBufferSource();
        
        if (profile.type === 'noise') {
            source.buffer = this.noiseBuffer;
        } else if (profile.type === 'file') {
            if (!this.fileBuffers[keyStr]) return; // Файл еще не загрузился
            source.buffer = this.fileBuffers[keyStr];
        }

        source.loop = true; 
        
        // --- ВОТ ЗДЕСЬ МЕНЯЕМ СКОРОСТЬ И ВЫСОТУ ЗВУКА ---
        // Если в профиле указана скорость, ставим её. Если нет — оставляем стандартную 1.0
        source.playbackRate.value = profile.playbackRate || 1.0;

        let lastNode = source;

        // Фильтры частот используем только для синтезируемого шума
        if (profile.type === 'noise') {
            const filter = this.ctx.createBiquadFilter();
            filter.type = profile.filterType;
            filter.frequency.value = profile.freq;
            source.connect(filter);
            lastNode = filter;
        }

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0; // Изначально звук выключен

        lastNode.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(); 
        this.channels[keyStr] = gainNode;
    }

    initChannels() {
        if (this.isInitialized) return;
        
        for (const [keyStr, profile] of Object.entries(this.soundProfiles)) {
            if (profile.type === 'noise' || (profile.type === 'file' && this.fileBuffers[keyStr])) {
                this.setupChannel(keyStr, profile);
            }
        }
        this.isInitialized = true;
    }

    setMasterVolume(value) {
        this.masterGain.gain.value = value;
    }

    queueEvent(elementType, actionType) {
        if (!this.soundProfiles[elementType]) return;
        this.frameEvents[elementType] = (this.frameEvents[elementType] || 0) + 1;
    }

    playOneShot(profileName) {
        if (this.ctx.state === 'suspended') return;
        const profile = this.oneShotProfiles[profileName];
        if (!profile) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = profile.filterType;
        filter.frequency.value = profile.freq;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(profile.baseVolume, this.ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + profile.duration);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + profile.duration);
    }

    playQueuedSounds() {
        if (this.ctx.state === 'suspended') return;
        if (!this.isInitialized) this.initChannels();

        const currentTime = this.ctx.currentTime;

        for (const [keyStr, profile] of Object.entries(this.soundProfiles)) {
            const count = this.frameEvents[keyStr] || 0;
            const gainNode = this.channels[keyStr];
            
            if (!gainNode) continue;

            if (count > 0) {
                // Плавное увеличение громкости в зависимости от количества пикселей
                const countMultiplier = 1 + Math.log10(count); 
                const targetVolume = profile.baseVolume * countMultiplier;
                gainNode.gain.setTargetAtTime(targetVolume, currentTime, 0.05);
            } else {
                gainNode.gain.setTargetAtTime(0, currentTime, 0.05);
            }
        }
        this.frameEvents = {};
    }
}

export const audioManager = new AudioManager();