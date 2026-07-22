import { ELEMENTS } from './elements.js';

export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this.noiseBuffer = this.createWhiteNoise();
        this.frameEvents = {};

       // ЗАЦИКЛЕННЫЕ ЗВУКИ (индивидуальная громкость для каждого)
        this.soundProfiles = {
            [ELEMENTS.SAND]: { baseVolume: 0.04, type: 'noise', filterType: 'highpass', freq: 3000 }, 
            [ELEMENTS.BUG]: { baseVolume: 0.35, type: 'noise', filterType: 'lowpass', freq: 300 },   
            [ELEMENTS.DIRT]: { baseVolume: 0.25, type: 'noise', filterType: 'lowpass', freq: 600 },
            [ELEMENTS.ASH]: { baseVolume: 0.08, type: 'noise', filterType: 'highpass', freq: 1500 },
            [ELEMENTS.GUNPOWDER]: { baseVolume: 0.1, type: 'noise', filterType: 'bandpass', freq: 800 },
            [ELEMENTS.SALT]: { baseVolume: 0.08, type: 'noise', filterType: 'highpass', freq: 4000 },
            [ELEMENTS.STEAM]: { baseVolume: 1.5, type: 'noise', filterType: 'bandpass', freq: 5000 }, 
            [ELEMENTS.ACID]: { baseVolume: 1.0, type: 'noise', filterType: 'bandpass', freq: 3500 },
            // Добавляем семечки в общую мягкую систему:
            [ELEMENTS.SEED]: { baseVolume: 0.1, type: 'noise', filterType: 'highpass', freq: 1500 },
            [ELEMENTS.FLOWER_SEED]: { baseVolume: 0.1, type: 'noise', filterType: 'highpass', freq: 1500 }
        };
        // КОРОТКИЕ ЗВУКИ (Одиночные эффекты)
        this.oneShotProfiles = {
            'PLACE_BLOCK': { baseVolume: 3.5, filterType: 'lowpass', freq: 150, duration: 0.1 }, 
            
            // --- НАЧАЛО НОВОГО КОДА ---
            // Резкое шипение с собственной громкостью
            // Теперь это highpass (пропускает только высокие шипящие частоты),
            // длится почти полсекунды и звучит в разы громче
            'EVAPORATE': { baseVolume: 2.0, filterType: 'highpass', freq: 4000, duration: 0.4 },
            // --- КОНЕЦ НОВОГО КОДА ---
        };

        this.channels = {}; 
        this.isInitialized = false;
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

    initChannels() {
        if (this.isInitialized) return;
        
        for (const [keyStr, profile] of Object.entries(this.soundProfiles)) {
            if (profile.type !== 'noise') continue;

            const source = this.ctx.createBufferSource();
            source.buffer = this.noiseBuffer;
            source.loop = true; 

            const filter = this.ctx.createBiquadFilter();
            filter.type = profile.filterType;
            filter.frequency.value = profile.freq;

            const gainNode = this.ctx.createGain();
            gainNode.gain.value = 0; 

            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);

            source.start(); 
            this.channels[keyStr] = gainNode;
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

    // НОВЫЙ МЕТОД: Воспроизведение короткого звука (например, клик мышкой для установки стены)
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
        // Резкий вход
        gainNode.gain.linearRampToValueAtTime(profile.baseVolume, this.ctx.currentTime + 0.01);
        // Затухание
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
            if (profile.type !== 'noise') continue;

            const count = this.frameEvents[keyStr] || 0;
            const gainNode = this.channels[keyStr];
            
            if (!gainNode) continue;

            if (count > 0) {
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