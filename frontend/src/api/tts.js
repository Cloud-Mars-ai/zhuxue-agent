import { useModelStore } from '@/stores/model'

let activeAudio = null
let activeUrl = ''

function stopActive() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio = null
  }
  if (activeUrl) {
    URL.revokeObjectURL(activeUrl)
    activeUrl = ''
  }
}

/**
 * StepAudio 3 TTS 非流式合成。
 * 官方接口：POST /v1/audio/speech，返回 mp3 二进制。
 */
export async function synthesizeSpeech(text, options = {}) {
  const store = useModelStore()
  const cfg = { ...store.config, ...(options.config || {}) }
  const input = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 1000)
  if (!input) throw new Error('没有可朗读的内容')
  if (!cfg.ttsApiKey) throw new Error('尚未配置语音合成密钥')

  const endpoint = `${(cfg.ttsBaseUrl || cfg.baseUrl).replace(/\/+$/, '')}/audio/speech`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.ttsApiKey}`,
    },
    body: JSON.stringify({
      model: cfg.ttsModel || 'stepaudio-3-tts',
      input,
      voice: cfg.ttsVoice || 'qinhenvsheng',
      response_format: 'mp3',
      speed: Number(cfg.ttsSpeed) || 1,
      volume: Number(cfg.ttsVolume) || 1,
      instruction: cfg.ttsInstruction || '用清晰、温和、有节奏的课堂讲解语气朗读。',
    }),
  })

  if (!resp.ok) {
    let detail = ''
    try {
      const data = await resp.json()
      detail = data?.error?.message || data?.message || ''
    } catch {
      // 音频接口失败时也可能返回空响应
    }
    throw new Error(`语音合成失败（HTTP ${resp.status}）${detail ? `：${detail}` : ''}`)
  }

  const blob = await resp.blob()
  if (!blob.size) throw new Error('语音接口没有返回音频')
  return blob
}

/** 同一时间只播放一段 AI 朗读，切换消息时自动停止上一条。 */
export async function playSpeech(text, options = {}) {
  stopActive()
  const blob = await synthesizeSpeech(text, { config: options.config })
  activeUrl = URL.createObjectURL(blob)
  activeAudio = new Audio(activeUrl)
  activeAudio.addEventListener(
    'ended',
    () => {
      stopActive()
      options.onEnded?.()
    },
    { once: true },
  )
  await activeAudio.play()
  return { stop: stopActive }
}

export function stopSpeech() {
  stopActive()
}
