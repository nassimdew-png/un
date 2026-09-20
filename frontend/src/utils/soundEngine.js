// High-Reliability Audio & Speech Engine with Backend Proxy Stream & Web Audio Synthesizers
class SoundEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.audioCtx = null;
    this.unlockAudio();
  }

  unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      }
    } catch (e) {
      console.warn('AudioContext unlock failed:', e);
    }
  }

  containsArabic(text) {
    return /[\u0600-\u06FF]/.test(text || '');
  }

  speak(text, lang = 'ar-SA', options = {}) {
    if (!text) return;
    this.unlockAudio();

    const isArabic = this.containsArabic(text) || (lang && lang.toLowerCase().startsWith('ar'));

    // If Arabic, always prioritize the dedicated server-side high-quality TTS audio stream
    if (isArabic) {
      this.playStreamAudio(text, 'ar');
      return;
    }

    // For French or others, use browser speechSynthesis if available
    if (this.synth) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = options.rate || 0.85;

      const voices = this.synth.getVoices() || [];
      const frVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('fr') ||
          v.name.toLowerCase().includes('french') ||
          v.name.toLowerCase().includes('français')
      );
      if (frVoice) utterance.voice = frVoice;

      this.synth.speak(utterance);
    } else {
      this.playStreamAudio(text, 'fr');
    }
  }

  playStreamAudio(text, lang = 'ar') {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    const cleanText = (text || '').replace(/«|»|"|'/g, '').trim();
    const streamUrl = `/api/public/tts-stream?text=${encodeURIComponent(cleanText)}&lang=${lang}`;

    this.currentAudio = new Audio(streamUrl);
    this.currentAudio.playbackRate = 0.9;
    this.currentAudio.play().catch((err) => {
      console.warn('Audio stream playback failed:', err);
      // Fallback tone
      this.playTone(520, 0.2);
    });
  }

  playTone(frequency = 440, duration = 0.2, type = 'sine') {
    this.unlockAudio();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = this.audioCtx || new AudioCtx();
      if (!this.audioCtx) this.audioCtx = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Tone play error:', e);
    }
  }

  playSuccessSound() {
    this.playTone(587.33, 0.12, 'sine'); // D5
    setTimeout(() => this.playTone(880, 0.25, 'triangle'), 120); // A5
  }

  playErrorSound() {
    this.playTone(220, 0.25, 'sawtooth'); // A3
  }

  playChime() {
    this.playTone(523.25, 0.15, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine'), 200); // G5
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
