# Core Features

这份文档面向使用者说明当前核心功能做什么、怎么工作的，以及代码大概落在哪些地方。

## 1. Image Resize

### 功能行为

图片缩放现在支持两种模式：

- 强制缩放：输出尺寸就是目标宽高，哪怕图片会被拉伸变形。
- 保持比例：输出图片会被缩放到目标框内部，不加黑边，不补白边。

例子：

- 输入：`720 x 480`
- 目标：`1024 x 1024`
- 强制缩放结果：`1024 x 1024`
- 保持比例结果：`1024 x 683`

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/resize/ResizePanel.tsx`
- `python/labtools_core/tasks/image_resize.py`
- `python/labtools_core/utils/resize.py`

执行流程：

1. 桌面端 UI 收集输入路径、输出路径、目标宽高和是否保持比例。
2. Tauri 把请求转发给 `python/desktop_runner.py`。
3. `labtools_core.dispatch` 把任务分发到 `run_image_resize`。
4. 如果是强制缩放，Pillow 直接把图片拉到指定宽高。
5. 如果是保持比例，共用的 `utils/resize.py` 会先算出一个“落在目标框内部”的输出尺寸。
6. 图片写入磁盘，最终尺寸再返回给 UI。

### 依赖

- Pillow

## 2. Video Resize

### 功能行为

视频缩放同样支持两种模式：

- 强制缩放：输出视频就是目标宽高，允许画面变形。
- 保持比例：输出视频缩放到目标框内部，不加黑边。

例子：

- 输入：`720 x 480`
- 目标：`1024 x 1024`
- 强制缩放结果：`1024 x 1024`
- 保持比例结果：约 `1024 x 682`

对视频来说，保持比例模式会尽量把结果修正成偶数宽高，因为很多视频编码器更偏好偶数尺寸。

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/resize/ResizePanel.tsx`
- `python/labtools_core/tasks/video_resize.py`
- `python/labtools_core/adapters/ffmpeg.py`
- `python/labtools_core/utils/resize.py`

执行流程：

1. UI 把视频缩放请求交给 Tauri。
2. Tauri 启动本地 Python runner。
3. `run_video_resize` 先检查输入视频和输出路径是否合法。
4. 如果开启保持比例，会先用 `ffprobe` 读取原视频尺寸。
5. 共用的缩放辅助函数计算出最终输出尺寸。
6. `ffmpeg` 执行真正的视频缩放，并把输出视频的 `SAR` 重置为 `1:1`，避免播放器继续沿用旧显示比例。
7. 最终输出路径和尺寸信息返回给 UI。

### 依赖

- ffmpeg
- ffprobe

## 3. 桌面端请求链路

当前桌面端一次请求的完整链路是：

1. React UI
2. Tauri 命令层 `src-tauri/src/main.rs`
3. `python/desktop_runner.py`
4. `labtools_core.dispatch`
5. 具体任务文件，例如 `image_resize.py` 或 `video_resize.py`

这样拆分的好处是：

- UI 层保持轻量
- 真正的处理逻辑集中在 Python 核心层
- 以后如果要加 CLI 或远程模式，可以复用同一套核心逻辑
