/**
 * 设置主页
 * 严格对照 Kuikly: pages/SettingScreen/SettingScreen.kt + viewmodel/SettingViewModel.kt
 *
 * Kuikly 实现细节：
 * - @Page("Setting")
 * - listData 精确结构（3个 SettingList 分组）
 * - "我的Lumina": 个性化→set_personalization, 记忆→set_memory, 智能体→hardWare
 * - "账户": 通行证管理(无跳转), 升级至Plus套餐→Tab, 未成年人监管→set_minors, Lumina账号→set_account
 * - "其他": 数据管理→set_data_management, 隐私与安全→set_privacy, 错误反馈→set_feedback, 关于→set_about
 * - 外观/主题色/语言 使用 FloatingPanel 内联切换（非独立页面）
 * - 退出登录: bridgeModule.clearAllLocalData() → closePage → openPage("login")
 * - 编辑资料弹窗: showModal 控制，包含头像选择 + 昵称输入
 * - SettingViewModel: initFromStorage, updateUsername, updateBio, uploadAvatar, fetchUserPublicInfo
 */
const auth = require('../../utils/auth')
const authApi = require('../../apis/auth')
const userApi = require('../../apis/user')

Page({
  data: {
    statusBarHeight: 0,
    // 用户信息（对应 SettingViewModel 的 observable 字段）
    luminaId: '',
    nickname: '未设置昵称',
    email: '',
    userPlan: '免费版',
    avatarUrl: '',
    // 编辑资料弹窗（对应 Kuikly: showModal）
    showEditModal: false,
    nicknameInput: '',
    // 退出确认
    showLogoutConfirm: false,
    // 设置列表数据（严格对照 Kuikly: listData）
    listData: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.initFromStorage()
    this.buildListData()
  },

  onShow() {
    this.fetchUserPublicInfo()
  },

  // ── 从本地存储恢复用户信息 ──
  // 对应 Kuikly: SettingViewModel.initFromStorage()
  initFromStorage() {
    this.setData({
      luminaId: wx.getStorageSync('lumina_id') || '',
      nickname: wx.getStorageSync('user_nickname') || wx.getStorageSync('username') || '未设置昵称',
      email: wx.getStorageSync('email') || '',
      userPlan: wx.getStorageSync('user_plan') || '免费版',
      avatarUrl: wx.getStorageSync('user_avatar_uri') || ''
    })
  },

  // ── 获取用户公开信息 ──
  // 对应 Kuikly: SettingViewModel.fetchUserPublicInfo()
  fetchUserPublicInfo() {
    const luminaId = this.data.luminaId
    if (!luminaId) return

    userApi.getUserInfo(luminaId)
      .then(data => {
        const nickname = data.nickname || this.data.nickname
        const email = data.email || this.data.email
        const avatarUrl = data.avatarUrl || this.data.avatarUrl
        this.setData({ nickname, email, avatarUrl })
        // 保存到本地（同步到其他页面）
        wx.setStorageSync('user_nickname', nickname)
        wx.setStorageSync('email', email)
        if (data.avatarUrl) wx.setStorageSync('user_avatar_uri', data.avatarUrl)
      })
      .catch(() => {})
  },

  // ── 构建设置列表 ──
  // 严格对照 Kuikly: SettingScreen.listData 的 3 个 SettingList 分组
  // Strictly match Kuikly: SettingScreen.kt listData (3 SettingList groups)
  buildListData() {
    const listData = [
      {
        listTitle: '我的Lumina',
        content: [
          { id: 0, itemTitle: '个性化', url: '/pages/setting-personalization/setting-personalization' },
          { id: 1, itemTitle: '记忆', url: '/pages/setting-memory/setting-memory' },
          { id: 2, itemTitle: '智能体', url: '/pages/agent-create/agent-create' }
        ]
      },
      {
        listTitle: '账户',
        content: [
          { id: 0, itemTitle: '通行证管理', subTitle: this.data.email || 'xxx@pointerwander.com' },
          { id: 1, itemTitle: '升级至Plus套餐', url: '/pages/setting-plus/setting-plus' },
          { id: 2, itemTitle: '未成年人监管', url: '/pages/setting-guardian/setting-guardian' },
          { id: 3, itemTitle: 'Lumina账号', subTitle: this.data.email || 'xxxx@xxx.com', url: '/pages/setting-account/setting-account' }
        ]
      },
      {
        listTitle: '',
        content: [
          { id: 0, itemTitle: '数据管理', url: '/pages/setting-data/setting-data' },
          { id: 1, itemTitle: '隐私与安全', url: '/pages/setting-privacy/setting-privacy' },
          { id: 2, itemTitle: '错误反馈', url: '/pages/setting-feedback/setting-feedback' },
          { id: 3, itemTitle: '关于', url: '/pages/setting-about/setting-about' }
        ]
      }
    ]
    this.setData({ listData })
  },

  // ── 点击设置项 ──
  // 对应 Kuikly: uiList 的 onItemClick 事件
  onItemClick(e) {
    const title = e.currentTarget.dataset.title
    const url = e.currentTarget.dataset.url

    // 外观/主题色/语言 在 Kuikly 中使用 FloatingPanel 内联切换
    // 小程序中跳转到独立页面
    if (title === '外观') {
      wx.navigateTo({ url: '/pages/setting-appearance/setting-appearance' })
      return
    }
    if (title === '语言') {
      wx.navigateTo({ url: '/pages/setting-language/setting-language' })
      return
    }

    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({ title: `${title}（开发中）`, icon: 'none' })
    }
  },

  // ── 编辑资料弹窗 ──
  // 对应 Kuikly: showModal 控制的 md3BottomSheet
  onShowEditModal() {
    this.setData({
      showEditModal: true,
      nicknameInput: this.data.nickname === '未设置昵称' ? '' : this.data.nickname
    })
  },
  onCloseEditModal() {
    this.setData({ showEditModal: false })
  },
  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  // ── 保存昵称 ──
  // 对应 Kuikly: SettingViewModel.updateUsername()
  onSaveNickname() {
    const newName = this.data.nicknameInput.trim()
    if (!newName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }

    userApi.updateUserInfo({ nickname: newName })
      .then(() => {
        this.setData({ nickname: newName, showEditModal: false })
        wx.setStorageSync('user_nickname', newName)
        wx.showToast({ title: '昵称更新成功', icon: 'success' })
      })
      .catch(err => {
        wx.showToast({ title: err.message || '更新失败', icon: 'none' })
      })
  },

  // ── 选择头像 ──
  // 对应 Kuikly: SettingViewModel.openAlbumToSelectPhoto2Upload()
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 小程序使用 wx.uploadFile 上传，而非 base64
        this.uploadAvatar(tempFilePath)
      }
    })
  },

  uploadAvatar(filePath) {
    wx.showLoading({ title: '上传中...' })
    const token = auth.getToken()
    wx.uploadFile({
      url: `${require('../../utils/config').BASE_URL}/user/avatar`,
      filePath: filePath,
      name: 'avatar',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        wx.hideLoading()
        try {
          const data = JSON.parse(res.data)
          if (data.data && data.data.avatarUrl) {
            this.setData({ avatarUrl: data.data.avatarUrl })
            wx.setStorageSync('user_avatar_uri', data.data.avatarUrl)
            wx.showToast({ title: '头像更新成功', icon: 'success' })
          }
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  // ── 退出登录 ──
  // 对应 Kuikly: bridgeModule.clearAllLocalData() → closePage → openPage("login")
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 先调用后端登出接口
          const luminaId = auth.getLuminaId()
          authApi.signOut(luminaId).catch(() => {})

          // 清除所有本地数据（对应 Kuikly: bridgeModule.clearAllLocalData()）
          wx.clearStorageSync()

          // 跳转到登录页（对应 Kuikly: routerModule.openPage("login", null)）
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  },

  // ── 导航 ──
  onBack() { wx.navigateBack() },
  onEditProfile() { this.onShowEditModal() },
  stopPropagation() {}
})
