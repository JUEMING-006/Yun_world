/**
 * 简易 Markdown 渲染器组件
 * 对应 Kuikly: MarkdownParser.kt + ChMarkdown.kt
 *
 * 将 Markdown 文本解析为结构化块列表，用 WXML 原生标签渲染
 * 支持：标题(h1-h3)、粗体、斜体、行内代码、代码块、列表、链接、引用
 */
Component({
  properties: {
    // Markdown 原始文本
    content: { type: String, value: '' }
  },

  data: {
    blocks: []
  },

  observers: {
    'content': function(val) {
      if (val) {
        this.setData({ blocks: this.parseMarkdown(val) })
      } else {
        this.setData({ blocks: [] })
      }
    }
  },

  methods: {
    /**
     * 简易 Markdown → 块列表解析器
     * 对应 Kuikly: MarkdownParser.kt 的 parse 逻辑
     */
    parseMarkdown(text) {
      if (!text) return []
      const lines = text.split('\n')
      const blocks = []
      let inCodeBlock = false
      let codeLang = ''
      let codeLines = []
      let inList = false
      let listType = '' // 'ul' or 'ol'
      let listItems = []

      const flushList = () => {
        if (inList && listItems.length > 0) {
          blocks.push({ type: listType, items: listItems })
          listItems = []
          inList = false
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // 代码块
        if (line.trimStart().startsWith('```')) {
          if (inCodeBlock) {
            blocks.push({ type: 'code', lang: codeLang, content: codeLines.join('\n') })
            codeLines = []
            codeLang = ''
            inCodeBlock = false
          } else {
            flushList()
            inCodeBlock = true
            codeLang = line.trimStart().substring(3).trim()
          }
          continue
        }

        if (inCodeBlock) {
          codeLines.push(line)
          continue
        }

        const trimmed = line.trim()

        // 空行
        if (!trimmed) {
          flushList()
          continue
        }

        // 标题
        const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
        if (hMatch) {
          flushList()
          blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2] })
          continue
        }

        // 引用
        if (trimmed.startsWith('> ')) {
          flushList()
          blocks.push({ type: 'blockquote', text: trimmed.substring(2) })
          continue
        }

        // 无序列表
        if (/^[-*+]\s+/.test(trimmed)) {
          if (!inList || listType !== 'ul') {
            flushList()
            inList = true
            listType = 'ul'
          }
          listItems.push(trimmed.replace(/^[-*+]\s+/, ''))
          continue
        }

        // 有序列表
        if (/^\d+\.\s+/.test(trimmed)) {
          if (!inList || listType !== 'ol') {
            flushList()
            inList = true
            listType = 'ol'
          }
          listItems.push(trimmed.replace(/^\d+\.\s+/, ''))
          continue
        }

        // 普通段落
        flushList()
        blocks.push({ type: 'paragraph', text: trimmed })
      }

      flushList()

      // 处理未闭合的代码块
      if (inCodeBlock && codeLines.length > 0) {
        blocks.push({ type: 'code', lang: codeLang, content: codeLines.join('\n') })
      }

      return blocks
    },

    /**
     * 行内 Markdown 格式化
     * 返回带标记的文本段列表，用于 rich-text 渲染
     */
    parseInline(text) {
      if (!text) return []
      // 简化：返回原始文本，实际可用 rich-text 组件渲染
      return [{ text: text, bold: false, code: false }]
    },

    // 复制代码块内容
    onCopyCode(e) {
      const content = e.currentTarget.dataset.content
      wx.setClipboardData({
        data: content,
        success() {
          wx.showToast({ title: '已复制', icon: 'success' })
        }
      })
    }
  }
})
