import confetti from 'canvas-confetti'

export const celebrateTask = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#1a56db', '#3f83f8', '#ffffff', 
             '#93c5fd', '#0f2460'],
  })
}

export const celebrateBooking = () => {
  const end = Date.now() + 2000
  const colors = ['#1a56db', '#3f83f8', '#ffffff']
  
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export const celebrateRSVP = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#057a55', '#def7ec', '#ffffff'],
    shapes: ['circle'],
  })
}
