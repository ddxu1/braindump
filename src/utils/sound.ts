/**
 * Plays a bubble pop sound effect using Web Audio API
 */
export function playDeleteSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create a bubble pop sound effect
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound - bubble pop (quick upward chirp then drop)
    oscillator.type = 'sine';

    // Start at a mid frequency
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    // Quick rise (the bubble expanding)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.02);
    // Then drop (the pop)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.08);

    // Volume envelope for bubble pop effect
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    // Hold briefly
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.02);
    // Fast decay for the pop
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    // Silently fail if audio context is not supported
    console.error('Failed to play sound:', error);
  }
}
