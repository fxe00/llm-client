# 应用资源文件

这个目录包含应用打包时需要的资源文件。

## 图标文件

请将以下图标文件放置在此目录中：

- `icon.ico` - Windows 图标 (256x256 像素)
- `icon.icns` - macOS 图标 (包含多种尺寸)
- `icon.png` - Linux 图标 (512x512 像素)

## 其他资源

- `dmg-background.png` - macOS DMG 安装包背景图 (540x380 像素)
- `entitlements.mac.plist` - macOS 权限配置文件

## 图标生成工具

推荐使用以下工具生成图标：

- **在线工具**: [icon.kitchen](https://icon.kitchen/)
- **macOS**: 使用 `iconutil` 命令
- **Windows**: 使用 IcoFX 或在线转换工具

## 临时图标

如果暂时没有图标文件，应用将使用默认的 Electron 图标。
