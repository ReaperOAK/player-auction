import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-IN').format(number)
}

export const getPositionColor = (position) => {
  const colors = {
    'GK': 'bg-yellow-500 text-yellow-900',
    'Defender': 'bg-blue-500 text-blue-900',
    'Midfield': 'bg-green-500 text-green-900',
    'Striker': 'bg-red-500 text-red-900',
    'Girls': 'bg-pink-500 text-pink-900',
  }
  return colors[position] || 'bg-gray-500 text-gray-900'
}

export const getPositionShort = (position) => {
  const shorts = {
    'GK': 'GK',
    'Defender': 'DEF',
    'Midfield': 'MID',
    'Striker': 'ST',
    'Girls': 'GIL',
  }
  return shorts[position] || position
}

export const getTimerClass = (timeLeft) => {
  if (timeLeft <= 5) return 'timer-critical'
  if (timeLeft <= 10) return 'timer-warning'
  return 'timer-normal'
}

export const playSound = (type) => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    
    oscillator.connect(gain)
    gain.connect(context.destination)
    
    switch (type) {
      case 'bid':
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0.1, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
        break
      case 'sold':
        oscillator.frequency.value = 600
        oscillator.type = 'triangle'
        gain.gain.setValueAtTime(0.2, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
        break
      case 'timer':
        oscillator.frequency.value = 1000
        oscillator.type = 'square'
        gain.gain.setValueAtTime(0.1, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1)
        break
      default:
        oscillator.frequency.value = 440
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0.1, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
    }
    
    oscillator.start()
    oscillator.stop(context.currentTime + 1)
  } catch (error) {
    console.warn('Could not play sound:', error)
  }
}

export const createConfetti = () => {
  const confettiContainer = document.createElement('div')
  confettiContainer.style.position = 'fixed'
  confettiContainer.style.top = '0'
  confettiContainer.style.left = '0'
  confettiContainer.style.width = '100%'
  confettiContainer.style.height = '100%'
  confettiContainer.style.pointerEvents = 'none'
  confettiContainer.style.zIndex = '9999'
  
  document.body.appendChild(confettiContainer)
  
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div')
    confetti.style.position = 'absolute'
    confetti.style.left = Math.random() * 100 + '%'
    confetti.style.top = '-10px'
    confetti.style.width = '10px'
    confetti.style.height = '10px'
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.animation = `confetti ${3 + Math.random() * 2}s linear infinite`
    confetti.style.animationDelay = Math.random() * 2 + 's'
    
    confettiContainer.appendChild(confetti)
  }
  
  setTimeout(() => {
    document.body.removeChild(confettiContainer)
  }, 5000)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
