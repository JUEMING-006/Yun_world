/**
 * 自定义顶部导航栏组件
 * 对应 Kuikly: AppTopBar + ChatScreenV2 导航栏
 *
 * 支持左侧返回按钮、中间标题、右侧操作按钮
 */
Component({
  properties: {
    // 导航栏标题
    title: { type: String, value: '' },
    // 是否显示返回按钮
    showBack: { type: Boolean, value: false },
    // 背景色
    bgColor: { type: String, value: 'transparent' },
    // 右侧按钮列表 [{icon, text, onClick}]
    rightButtons: { type: Array, value: [] }
  },

  data: {
    statusBarHeight: 0,
    navHeight: 44
  },

  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync()
      this.setData({
        statusBarHeight: sysInfo.statusBarHeight || 20
      })
    }
  },

  methods: {
    onBack() {
      this.triggerEvent('back')
    },

    onRightBtn(e) {
      const index = e.currentTarget.dataset.index
      const btn = this.data.rightButtons[index]
      if (btn && btn.onClick) {
        btn.onClick()
      }
      this.triggerEvent('rightbtn', { index })
    }
  }
})
