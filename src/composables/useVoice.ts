/**
 * useVoice —— Web Speech API 封装
 *
 * 设计要点：
 *  - Web Speech API 在 Tauri WebView2 中可能不可用或不稳定，所有调用前先做特性检测。
 *  - 识别结果通过 transcript 暴露给上层（任务输入框 / 闪念输入框）。
 *  - 默认 zh-CN，单次识别 (continuous=false)，开启 interimResults 实时显示中间结果。
 *  - 若用户在设置中开启「语音转写智能润色」，识别结束后由 useAI 进一步处理。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useVoice() {
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref<string | null>(null)
  const isSupported = ref(false)

  let recognition: SpeechRecognition | null = null

  const init = () => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      isSupported.value = false
      error.value = '当前环境不支持语音识别'
      return
    }
    isSupported.value = true
    recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      if (finalText) transcript.value += finalText
      interimTranscript.value = interimText
    }

    recognition.onerror = (event) => {
      error.value = `语音识别错误: ${event.error}`
      isListening.value = false
    }

    recognition.onend = () => {
      isListening.value = false
      interimTranscript.value = ''
    }
  }

  const start = () => {
    if (!recognition) {
      error.value = '语音识别未初始化'
      return
    }
    // 清空上一次结果
    transcript.value = ''
    interimTranscript.value = ''
    error.value = null
    try {
      recognition.start()
      isListening.value = true
    } catch (e) {
      // 重复 start 会抛 InvalidStateError，忽略
      error.value = `启动失败: ${(e as Error).message}`
    }
  }

  const stop = () => {
    recognition?.stop()
    isListening.value = false
  }

  const clear = () => {
    transcript.value = ''
    interimTranscript.value = ''
    error.value = null
  }

  onMounted(init)
  onBeforeUnmount(() => {
    try {
      recognition?.abort()
    } catch {
      /* ignore */
    }
  })

  // TODO(Phase 3): WebView2 不支持时的降级方案：
  //   方案 A：隐藏语音按钮，仅保留文字输入；
  //   方案 B：调用 Rust 侧 Whisper 本地模型（需引入 whisper.cpp，体积增大，暂不采用）。
  // TODO(Phase 3): 首次使用时引导用户在系统设置中授予麦克风权限。

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    start,
    stop,
    clear,
  }
}
