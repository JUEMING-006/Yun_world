use tauri::window::{Effect, Effects, EffectsBuilder};

// ====================================================================
// 跨平台毛玻璃效果
// Tauri 2.0 中通过 WebviewWindow::set_effects 调用原生
// ====================================================================

pub fn apply_glass_effect(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        // Windows 11 优先使用 Acrylic；Windows 10 降级为 Blur
        // TODO(Phase 5): 检测系统版本，Win10 改用 Effect::Blur
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effects(vec![Effect::Acrylic])
                .build(),
        );
    }
    #[cfg(target_os = "macos")]
    {
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effects(vec![Effect::UnderWindowBackground])
                .build(),
        );
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        // Linux 等系统：纯 CSS 半透明模拟（已在 CSS 中定义）
        let _ = window.set_effects(Effects::default());
    }
}
