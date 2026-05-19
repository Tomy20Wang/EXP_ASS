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

## 3. Video to Frames

### 功能行为

这个功能会把输入视频的每一帧导出为 PNG 图片，并写入你选择的输出文件夹。

当前输出命名规则：

- `frame_00001.png`
- `frame_00002.png`
- `frame_00003.png`

也就是使用 `frame_%05d.png` 这样的连续编号格式。

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/video/VideoFramesPanel.tsx`
- `python/labtools_core/tasks/video_to_frames.py`
- `python/labtools_core/adapters/ffmpeg.py`

执行流程：

1. UI 收集输入视频路径和输出文件夹路径。
2. Tauri 把请求发送到本地 Python runner。
3. `labtools_core.dispatch` 把任务分发到 `run_video_to_frames`。
4. Python 检查输入视频是否存在，并创建输出文件夹。
5. 输出路径会拼成 `frame_%05d.png` 这样的图片序列模板。
6. `ffmpeg` 执行逐帧导出，把视频帧写成 PNG 图片。
7. UI 最终拿到输出文件夹路径和导出命名规则。

### 依赖

- ffmpeg

## 4. Batch Image Resize

### 功能行为

这个功能会读取你选择的输入文件夹，把其中直接包含的图片文件统一缩放后写入输出文件夹。

当前支持：

- `.jpg`
- `.jpeg`
- `.png`

当前版本处理的是输入文件夹里直接包含的文件，不会递归处理子文件夹。

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/batch/BatchResizePanel.tsx`
- `python/labtools_core/tasks/batch_tasks.py`
- `python/labtools_core/tasks/image_resize.py`

执行流程：

1. UI 收集输入文件夹、输出文件夹、目标宽高和是否保持比例。
2. Python 核心层扫描输入文件夹内直接包含的图片文件。
3. 对每一张图片，批处理任务都会构造一个单独的 `image_resize` 子任务。
4. 子任务直接复用现有的 Pillow 缩放逻辑。
5. 输出文件会按原文件名写入输出文件夹。

## 5. Batch Video Resize

### 功能行为

这个功能会读取输入文件夹中直接包含的 `.mp4` 视频文件，统一缩放后写入输出文件夹。

当前版本同样不会递归处理子文件夹。

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/batch/BatchResizePanel.tsx`
- `python/labtools_core/tasks/batch_tasks.py`
- `python/labtools_core/tasks/video_resize.py`

执行流程：

1. UI 收集输入文件夹、输出文件夹、目标宽高和是否保持比例。
2. 批处理任务筛选输入目录中直接包含的 `.mp4` 文件。
3. 每个视频都会生成一个单独的 `video_resize` 子任务。
4. 子任务继续沿用现有的 `ffprobe + ffmpeg` 缩放逻辑。
5. 输出视频会按原文件名写入输出文件夹。

## 6. Batch Video to Frames

### 功能行为

这个功能会读取输入文件夹中直接包含的 `.mp4` 视频，并在输出文件夹下为每个视频建立一个同名子文件夹。

例如：

- 输入视频：`clip_a.mp4`
- 输出子目录：`clip_a/`
- 帧文件命名：`frame_00001.png`

### 实现逻辑

主要文件：

- `apps/desktop/ui/src/features/batch/BatchVideoFramesPanel.tsx`
- `python/labtools_core/tasks/batch_tasks.py`
- `python/labtools_core/tasks/video_to_frames.py`

执行流程：

1. UI 收集输入文件夹和输出文件夹。
2. Python 核心层筛选输入目录中直接包含的 `.mp4` 文件。
3. 对每个视频，批处理任务都会构造一个 `video_to_frames` 子任务。
4. 每个子任务的输出目录会被设置成 `输出根目录 / 视频文件名（去掉 .mp4）`。
5. 原有逐帧导出逻辑继续把图片按 `frame_%05d.png` 写入对应子目录。

## 7. 桌面端请求链路

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
