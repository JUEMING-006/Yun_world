# 应用图标

在首次 `pnpm tauri build` 打包前，请执行以下命令生成所需尺寸的图标：

```bash
# 如果你的图标源文件是 1024x1024 的 PNG
pnpm tauri icon path/to/icon-1024.png
# 或者（如果已安装 @tauri-apps/cli 为 devDependency）
npx tauri icon path/to/icon-1024.png
```

执行后 Tauri 会自动生成 `icons/` 下的全部所需尺寸。

手动生成步骤（备用）：
1. 准备一张 1024×1024 的 PNG 源文件（背景透明推荐）
2. 生成各尺寸：
   - 32×32、128×128、128×128@2x（PNG）
   - icon.ico（Windows）
   - icon.icns（macOS）
3. 放至 `src-tauri/icons/` 目录

> 若 `tauri build` 时因缺少图标报错，先在 `tauri.conf.json` 中注释掉 `bundle.icon` 字段，
> 开发阶段（`pnpm tauri dev`）通常不受影响。
