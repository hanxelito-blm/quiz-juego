export const fetchQuestions = async () => {
  try {
    const response = await fetch('/api/questions')
    if (!response.ok) throw new Error('Error al cargar preguntas')
    return await response.json()
  } catch (error) {
    console.error('fetchQuestions error:', error)
    throw error
  }
}

export const submitScore = async (data) => {
  const WEBHOOK_URL = 'https://your-n8n-webhook-url.com/webhook/snake-game-score'

  const scoreData = {
    playerName: data.playerName,
    score: data.score,
    level: data.level,
    date: new Date().toISOString(),
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData),
    })

    if (response.ok) {
      const result = await response.json()
      saveScoreLocally(scoreData)
      return result
    }
    throw new Error('Error al enviar el puntaje')
  } catch (error) {
    console.warn('Webhook submission fallback to localStorage:', error.message)
    saveScoreLocally(scoreData)
    return {
      success: true,
      message: 'Guardado localmente (sin conexión al servidor)',
      savedLocally: true,
      data: scoreData,
    }
  }
}

const saveScoreLocally = (scoreData) => {
  try {
    const existing = JSON.parse(localStorage.getItem('localScores') || '[]')
    existing.push({ ...scoreData, id: Date.now() })
    existing.sort((a, b) => b.score - a.score)
    if (existing.length > 50) existing.length = 50
    localStorage.setItem('localScores', JSON.stringify(existing))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export const fetchScores = async () => {
  try {
    const response = await fetch('/api/scores')
    if (!response.ok) throw new Error('API error')
    const apiScores = await response.json()

    const localScores = JSON.parse(localStorage.getItem('localScores') || '[]')
    if (localScores.length > 0) {
      const merged = [...localScores, ...apiScores].sort((a, b) => b.score - a.score)
      return merged
    }

    return apiScores
  } catch (error) {
    console.warn('fetchScores fallback to localStorage:', error.message)
    const localScores = JSON.parse(localStorage.getItem('localScores') || '[]')
    return localScores.sort((a, b) => b.score - a.score)
  }
}

export const saveScore = (score) => {
  return submitScore(score)
}