// Sound URLs - you can replace these with your own sound files
const SOUNDS = {
  userJoin: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  message: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3'
};

class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private isMuted: boolean = false;

  private constructor() {
    // Initialize sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      this.sounds[key] = new Audio(url);
    });
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public playSound(soundName: keyof typeof SOUNDS) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      // Reset the sound to the beginning
      sound.currentTime = 0;
      // Play the sound
      sound.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
  }
}

export const soundManager = SoundManager.getInstance(); 