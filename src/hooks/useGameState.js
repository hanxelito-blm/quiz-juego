import { useState, useCallback, useRef, useEffect } from 'react'

const WORLD_SIZE = 5000
const SEGMENT_SPACING = 5
const INITIAL_SPEED = 2.5
const BASE_FOOD_COUNT = 35

const FOOD_TYPES = [
  { type: 'normal',  weight: 60, color: '#eab308', points: 10, radius: 6, effect: null },
  { type: 'double',  weight: 15, color: '#f59e0b', points: 20, radius: 7, effect: 'double' },
  { type: 'speed',   weight: 10, color: '#06b6d4', points: 15, radius: 6, effect: 'speed' },
  { type: 'shrink',  weight: 5,  color: '#22c55e', points: 5,  radius: 5, effect: 'shrink' },
  { type: 'ghost',   weight: 5,  color: '#a855f7', points: 25, radius: 8, effect: 'ghost' },
]

const ENEMY_PALETTES = [
  { head: '#ef4444', trail: '#7f1d1d' },
  { head: '#a855f7', trail: '#4c1d95' },
  { head: '#06b6d4', trail: '#164e63' },
  { head: '#f97316', trail: '#7c2d12' },
]

const pickFoodType = () => {
  const total = FOOD_TYPES.reduce((s, f) => s + f.weight, 0)
  let r = Math.random() * total
  for (const f of FOOD_TYPES) {
    r -= f.weight
    if (r <= 0) return f
  }
  return FOOD_TYPES[0]
}

const randomFood = () => {
  const baseType = pickFoodType()
  return {
    x:      Math.random() * WORLD_SIZE,
    y:      Math.random() * WORLD_SIZE,
    color:  baseType.color,
    radius: baseType.radius + Math.random() * 2,
    points: baseType.points,
    effect: baseType.effect,
    type:   baseType.type,
  }
}

const randomObstacle = () => ({
  x:      Math.random() * WORLD_SIZE,
  y:      Math.random() * WORLD_SIZE,
  radius: 30 + Math.random() * 80,
})

const randomEnemy = (id) => {
  let x, y
  do {
    x = Math.random() * WORLD_SIZE
    y = Math.random() * WORLD_SIZE
  } while (Math.hypot(x - WORLD_SIZE / 2, y - WORLD_SIZE / 2) < 500)

  const angle = Math.random() * Math.PI * 2
  const segs = []
  for (let i = 0; i < 12; i++) {
    segs.push({
      x: x - Math.cos(angle) * i * SEGMENT_SPACING,
      y: y - Math.sin(angle) * i * SEGMENT_SPACING,
    })
  }
  return {
    id, x, y, angle,
    turnTimer: 20 + Math.floor(Math.random() * 50),
    speed: 1.0 + Math.random() * 0.7,
    segments: segs,
    palette: ENEMY_PALETTES[id % ENEMY_PALETTES.length],
    chasing: false,
  }
}

export const useGameState = (customColor, customHead) => {
  const [score,      setScore]      = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isRunning,  setIsRunning]  = useState(false)

  const snakeRef       = useRef([])
  const foodRef        = useRef([])
  const obstaclesRef   = useRef([])
  const enemiesRef     = useRef([])
  const directionRef   = useRef({ x: 1, y: 0 })
  const targetAngleRef = useRef(0)
  const angleRef       = useRef(0)
  const scoreRef       = useRef(0)
  const growthRef      = useRef(0)
  const speedBoostRef  = useRef(0)
  const ghostRef       = useRef(0)
  const isRunningRef   = useRef(false)
  const isGameOverRef  = useRef(false)
  const cameraRef      = useRef({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 })

  const defaultColor = customColor || '#eab308'
  const defaultHead  = customHead || 'normal'

  const initGame = useCallback(() => {
    const cx = WORLD_SIZE / 2
    const cy = WORLD_SIZE / 2

    const snake = []
    for (let i = 0; i < 5; i++) snake.push({ x: cx - i * SEGMENT_SPACING, y: cy })

    const food = []
    for (let i = 0; i < BASE_FOOD_COUNT; i++) food.push(randomFood())

    const obstacles = []
    for (let i = 0; i < 80; i++) obstacles.push(randomObstacle())

    const enemies = []
    for (let i = 0; i < 3; i++) enemies.push(randomEnemy(i))

    snakeRef.current    = snake
    foodRef.current     = food
    obstaclesRef.current = obstacles
    enemiesRef.current  = enemies
    directionRef.current = { x: 1, y: 0 }
    targetAngleRef.current = 0
    angleRef.current    = 0
    scoreRef.current    = 0
    growthRef.current   = 0
    speedBoostRef.current = 0
    ghostRef.current    = 0
    isRunningRef.current = true
    isGameOverRef.current = false
    cameraRef.current   = { x: cx, y: cy }

    setScore(0)
    setIsGameOver(false)
    setIsRunning(true)
  }, [])

  const updateDirection = useCallback((key) => {
    const map = {
      ArrowUp: -Math.PI / 2, w: -Math.PI / 2, W: -Math.PI / 2,
      ArrowDown: Math.PI / 2, s: Math.PI / 2,  S: Math.PI / 2,
      ArrowLeft: Math.PI,     a: Math.PI,       A: Math.PI,
      ArrowRight: 0,          d: 0,             D: 0,
    }
    if (map[key] !== undefined) targetAngleRef.current = map[key]
  }, [])

  const gameStep = useCallback(() => {
    if (!isRunningRef.current || isGameOverRef.current) return true

    const snake = snakeRef.current
    const snakeLen = snake.length
    let baseSpeed = INITIAL_SPEED + snakeLen * 0.0015
    if (speedBoostRef.current > 0) {
      baseSpeed *= 1.4
      speedBoostRef.current--
    }

    let diff = targetAngleRef.current - angleRef.current
    while (diff >  Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI
    angleRef.current += diff * 0.1

    directionRef.current = {
      x: Math.cos(angleRef.current),
      y: Math.sin(angleRef.current),
    }

    const head = {
      x: snake[0].x + directionRef.current.x * baseSpeed,
      y: snake[0].y + directionRef.current.y * baseSpeed,
    }

    if (head.x < 0) head.x = WORLD_SIZE
    if (head.x > WORLD_SIZE) head.x = 0
    if (head.y < 0) head.y = WORLD_SIZE
    if (head.y > WORLD_SIZE) head.y = 0

    cameraRef.current.x = head.x
    cameraRef.current.y = head.y

    let ate = false
    let ateEffect = null
    const newFood = []
    for (const f of foodRef.current) {
      if (!ate && Math.hypot(head.x - f.x, head.y - f.y) < 14 + f.radius) {
        ate = true
        ateEffect = f.effect
        scoreRef.current += f.points
        // Aumenta el crecimiento significativamente (de 3 a 10)
        growthRef.current += (f.effect === 'double' ? 20 : 10)
        if (f.effect === 'speed') speedBoostRef.current = 180
        else if (f.effect === 'ghost') ghostRef.current = 300
      } else {
        newFood.push(f)
      }
    }

    while (newFood.length < BASE_FOOD_COUNT) newFood.push(randomFood())
    foodRef.current = newFood

    const newSnake = [head, ...snake]

    if (growthRef.current > 0) {
      growthRef.current--
    }

    snakeRef.current = newSnake

    const isGhost = ghostRef.current > 0
    if (ghostRef.current > 0) ghostRef.current--

    if (!isGhost) {
      for (const obs of obstaclesRef.current) {
        if (Math.hypot(head.x - obs.x, head.y - obs.y) < obs.radius + 10) {
          isRunningRef.current  = false
          isGameOverRef.current = true
          setScore(scoreRef.current)
          setIsGameOver(true)
          setIsRunning(false)
          return false
        }
      }

      for (let i = 6; i < newSnake.length; i++) {
        if (Math.hypot(head.x - newSnake[i].x, head.y - newSnake[i].y) < 8) {
          isRunningRef.current  = false
          isGameOverRef.current = true
          setScore(scoreRef.current)
          setIsGameOver(true)
          setIsRunning(false)
          return false
        }
      }
    }

    const distToPlayer = (e) => Math.hypot(head.x - e.x, head.y - e.y)

    for (const enemy of enemiesRef.current) {
      const d = distToPlayer(enemy)
      enemy.chasing = d < 300 + snakeLen * 0.5

      if (enemy.chasing) {
        enemy.angle = Math.atan2(head.y - enemy.y, head.x - enemy.x)
      } else {
        enemy.turnTimer--
        if (enemy.turnTimer <= 0) {
          enemy.angle += (Math.random() - 0.5) * Math.PI * 0.8
          enemy.turnTimer = 30 + Math.floor(Math.random() * 70)
        }
      }

      enemy.x += Math.cos(enemy.angle) * enemy.speed
      enemy.y += Math.sin(enemy.angle) * enemy.speed

      if (enemy.x < 0)          enemy.x = WORLD_SIZE
      if (enemy.x > WORLD_SIZE) enemy.x = 0
      if (enemy.y < 0)          enemy.y = WORLD_SIZE
      if (enemy.y > WORLD_SIZE) enemy.y = 0

      enemy.segments.unshift({ x: enemy.x, y: enemy.y })
      if (enemy.segments.length > 15) enemy.segments.pop()

      if (!isGhost) {
        for (const seg of enemy.segments) {
          if (Math.hypot(head.x - seg.x, head.y - seg.y) < 10) {
            isRunningRef.current  = false
            isGameOverRef.current = true
            setScore(scoreRef.current)
            setIsGameOver(true)
            setIsRunning(false)
            return false
          }
        }
      }
    }

    if (ate) setScore(scoreRef.current)

    return true
  }, [])

  const endGame = useCallback(() => {
    isRunningRef.current  = false
    isGameOverRef.current = true
    setIsRunning(false)
    setIsGameOver(true)
    return scoreRef.current
  }, [])

  useEffect(() => { initGame() }, [initGame])

  return {
    score,
    isGameOver,
    isRunning,
    isRunningRef,
    isGameOverRef,
    scoreRef,
    snakeRef,
    foodRef,
    obstaclesRef,
    enemiesRef,
    cameraRef,
    gameStep,
    endGame,
    initGame,
    updateDirection,
    defaultColor,
    defaultHead,
  }
}

export default useGameState