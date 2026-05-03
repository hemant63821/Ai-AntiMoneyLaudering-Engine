export function playAlertSound(): void {
  const ctx = new AudioContext()

  const tone = (freq: number, start: number, duration: number, peak = 0.28) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.start(start)
    osc.stop(start + duration)
  }

  const t = ctx.currentTime
  tone(880, t,        0.18)   // A5  — attack
  tone(1318, t + 0.12, 0.22)  // E6  — resolve up

  setTimeout(() => ctx.close(), 800)
}
