/**
 * SoundManager — Handles audio playback for the game.
 *
 * Manages background music and sound effects. Handles browser autoplay
 * restrictions by deferring playback until the first user interaction.
 */
export class SoundManager {
  constructor() {
    this.bgm = null
    this.muted = false
    this.bgmVolume = 0.3
    this.pendingBGM = false
    this.pendingBGMSrc = null

    // Browsers block autoplay until user interacts with the page.
    // We listen for the first click or keypress to start deferred audio.
    this.userHasInteracted = false
    this.handleInteraction = () => {
      this.userHasInteracted = true
      if (this.pendingBGM) {
        this.pendingBGM = false
        this.playBGM(this.pendingBGMSrc || undefined)
      }
      window.removeEventListener('click', this.handleInteraction)
      window.removeEventListener('keydown', this.handleInteraction)
    }
    window.addEventListener('click', this.handleInteraction)
    window.addEventListener('keydown', this.handleInteraction)
  }

  /**
   * Start looping background music.
   *
   * @param {string} [src] - Path to the audio file. Defaults to 'sounds/bgm.mp3'.
   */
  playBGM(src = 'sounds/bgm.mp3') {
    if (!this.userHasInteracted) {
      this.pendingBGM = true
      this.pendingBGMSrc = src
      return
    }

    if (this.bgm) {
      this.bgm.pause()
    }

    // Preload the audio without blocking gameplay.
    // The 'none' preload lets the browser fetch it gradually in the background
    // instead of competing with WebSocket traffic for bandwidth.
    this.bgm = new Audio()
    this.bgm.preload = 'auto'
    this.bgm.loop = true
    this.bgm.volume = this.muted ? 0 : this.bgmVolume
    this.bgm.src = src

    // Wait until enough is buffered before playing
    this.bgm.addEventListener('canplaythrough', () => {
      this.bgm.play().catch(() => {})
    }, { once: true })
  }

  /**
   * Stop background music.
   */
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }
    this.pendingBGM = false
  }

  /**
   * Play a one-shot sound effect.
   *
   * @param {string} src - Path to the audio file.
   * @param {number} [volume] - Volume from 0 to 1. Defaults to 0.5.
   */
  playEffect(src, volume = 0.5) {
    if (this.muted || !this.userHasInteracted) return

    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  }

  /**
   * Toggle mute on/off. Returns the new muted state.
   */
  toggleMute() {
    this.muted = !this.muted
    if (this.bgm) {
      this.bgm.volume = this.muted ? 0 : this.bgmVolume
    }
    return this.muted
  }

  /**
   * Set background music volume.
   *
   * @param {number} volume - Volume from 0 to 1.
   */
  setVolume(volume) {
    this.bgmVolume = volume
    if (this.bgm && !this.muted) {
      this.bgm.volume = volume
    }
  }

  /**
   * Clean up event listeners.
   */
  destroy() {
    this.stopBGM()
    window.removeEventListener('click', this.handleInteraction)
    window.removeEventListener('keydown', this.handleInteraction)
  }
}
