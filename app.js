const nav = document.getElementById('nav')
const burger = document.getElementById('burger')
const social = document.querySelector('.social')
const primaryBtn = document.querySelector('.btn.primary')

// Ініціалізація aria
if (burger) burger.setAttribute('aria-expanded', 'false')

function lockBody(lock = true) {
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}

function toggleNav() {
  if (!nav || !burger) return
  const isOpen = nav.classList.toggle('open')
  burger.classList.toggle('x', isOpen)
  burger.setAttribute('aria-expanded', String(isOpen))
  // блокування прокрутки коли меню відкрите (корисно на мобілці)
  lockBody(isOpen)
}
if (burger && nav) {
  burger.addEventListener('click', toggleNav)
}

// Плавний скрол і закриття меню після кліку
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    if (id && id.length > 1) {
      const target = document.querySelector(id)
      if (target) {
        e.preventDefault()
        const headerHeight = document.querySelector('.site-header').offsetHeight
        const targetPosition =
          target.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: targetPosition - headerHeight - 16, // 16px додатковий відступ
          behavior: 'smooth',
        })
        // Закривати меню після кліку на мобілці
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open')
          burger && burger.classList.remove('x')
          burger && burger.setAttribute('aria-expanded', 'false')
          lockBody(false)
        }
      }
    }
  })
})

// ===== Reveal on view (IntersectionObserver) =====
const io = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view')
        observer.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.18 }
)
document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

// ===== Рік у футері (якщо є елемент #y) =====
const ys = document.getElementById('y')
if (ys) ys.textContent = new Date().getFullYear()

// ===== Паралакс-блоби (щоб не вантажити на мобілці) =====
const blobs = document.querySelectorAll('.blob')
if (blobs.length) {
  let enabled = true
  // Вимикаємо складні обчислення на touch-пристроях
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (isTouch) enabled = false

  if (enabled) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10
      const y = (e.clientY / window.innerHeight - 0.5) * 10
      blobs.forEach((b, i) => {
        // використовується невеликий множник — щоб не зсунуло сильно
        const mul = 1 + i * 0.6
        b.style.transform = `translate(${x * mul}px, ${y * mul}px)`
      })
    })
  }
}

// ===== Модалка: відкриття/закриття, клік поза панеллю, ESC, блокування скролу =====
function bindModal() {
  const modal = document.getElementById('modal')
  if (!modal) return

  document.querySelectorAll("[data-open='modal']").forEach((btn) =>
    btn.addEventListener('click', (e) => {
      if (e) e.preventDefault()
      modal.setAttribute('aria-hidden', 'false')
      lockBody(true)
    })
  )

  document.querySelectorAll("[data-close='modal']").forEach((btn) =>
    btn.addEventListener('click', (e) => {
      if (e) e.preventDefault()
      modal.setAttribute('aria-hidden', 'true')
      lockBody(false)
    })
  )

  // закриття по кліку на backdrop
  modal.addEventListener('click', (e) => {
    if (
      e.target === modal ||
      (e.target.classList && e.target.classList.contains('modal-backdrop'))
    ) {
      modal.setAttribute('aria-hidden', 'true')
      lockBody(false)
    }
  })

  // ESC закриває модалку і меню
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.setAttribute('aria-hidden', 'true')
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open')
        burger && burger.classList.remove('x')
        burger && burger.setAttribute('aria-expanded', 'false')
        lockBody(false)
      }
    }
  })
}
bindModal()

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.cert-track')
  const viewport = document.querySelector('.cert-viewport')
  const nextBtn = document.querySelector('.cert-arrow.next')
  const prevBtn = document.querySelector('.cert-arrow.prev')
  const dotsNav = document.querySelector('.cert-dots')

  if (!track || !viewport || !dotsNav) return

  const slides = Array.from(track.children)
  let index = 0
  let dots = []

  function recalc() {
    const slideWidth = slides[0].getBoundingClientRect().width
    const visible =
      window.innerWidth <= 680
        ? 1
        : Math.floor(viewport.offsetWidth / slideWidth)
    const pages = Math.ceil(slides.length / visible)
    return { slideWidth, visible, pages }
  }

  function buildDots() {
    dotsNav.innerHTML = ''
    const { pages } = recalc()
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button')
      dot.type = 'button'
      if (i === 0) dot.classList.add('active')
      dot.addEventListener('click', () => goTo(i))
      dotsNav.appendChild(dot)
    }
    dots = Array.from(dotsNav.children)
  }

  function goTo(pageIndex) {
    const { slideWidth, visible, pages } = recalc()
    index = Math.max(0, Math.min(pageIndex, pages - 1))
    track.style.transform = `translateX(-${index * visible * slideWidth}px)`
    dots.forEach((d) => d.classList.remove('active'))
    dots[index] && dots[index].classList.add('active')
  }

  nextBtn?.addEventListener('click', () => {
    const { pages } = recalc()
    if (index < pages - 1) goTo(index + 1)
  })

  prevBtn?.addEventListener('click', () => {
    if (index > 0) goTo(index - 1)
  })

  // swipe на моб
  let startX = 0
  let isDown = false

  viewport.addEventListener('touchstart', (e) => {
    isDown = true
    startX = e.touches[0].clientX
  })

  viewport.addEventListener('touchmove', (e) => {
    if (!isDown) return
    const dx = startX - e.touches[0].clientX
    if (Math.abs(dx) > 40) {
      if (dx > 0) {
        const { pages } = recalc()
        if (index < pages - 1) goTo(index + 1)
      } else {
        if (index > 0) goTo(index - 1)
      }
      isDown = false
    }
  })

  viewport.addEventListener('touchend', () => {
    isDown = false
  })

  // пересчет при ресайзі
  window.addEventListener('resize', () => {
    buildDots()
    goTo(index)
  })

  // стартова ініціалізація
  buildDots()
  goTo(0)
})

const circleCount = 20
const container = document.createElement('div')
container.className = 'background-circles'
document.body.appendChild(container)

const circles = []

for (let i = 0; i < circleCount; i++) {
  const circle = document.createElement('div')
  circle.className = 'circle'

  const size = Math.random() * 200 + 50
  circle.style.width = `${size}px`
  circle.style.height = `${size}px`

  const colors = ['#dff2ed', '#bfe1d7', '#93bdaf', '#cde5db', '#a9d3c6']
  const color = colors[Math.floor(Math.random() * colors.length)]
  circle.style.background = color

  circle.style.top = `${Math.random() * 100}%`
  circle.style.left = `${Math.random() * 100}%`

  container.appendChild(circle)
  circles.push(circle)
}

function moveCircles() {
  circles.forEach((circle) => {
    const dx = (Math.random() - 0.5) * 2 // -1 до 1 %
    const dy = (Math.random() - 0.5) * 2
    const currentTop = parseFloat(circle.style.top)
    const currentLeft = parseFloat(circle.style.left)
    circle.style.top = `${Math.min(100, Math.max(0, currentTop + dy))}%`
    circle.style.left = `${Math.min(100, Math.max(0, currentLeft + dx))}%`
  })
}

setInterval(moveCircles, 2000)

const visible =
  window.innerWidth <= 680
    ? 1
    : Math.floor(document.querySelector('.cert-viewport').offsetWidth / 300)

function updateVisible() {
  const viewport = document.querySelector('.cert-viewport')
  const track = document.querySelector('.cert-track')
  const slides = document.querySelectorAll('.cert-slide')
  let visible =
    window.innerWidth <= 680
      ? 1
      : Math.floor(viewport.offsetWidth / slides[0].offsetWidth)

  track.style.transform = `translateX(-${
    currentIndex * (slides[0].offsetWidth + 16)
  }px)`
}

window.addEventListener('resize', updateVisible)
updateVisible()
