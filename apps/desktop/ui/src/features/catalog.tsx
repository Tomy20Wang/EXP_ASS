import type { ReactNode } from "react";
import type { Language } from "../i18n";
import { BatchResizePanel } from "./batch/BatchResizePanel";
import { BatchVideoFramesPanel } from "./batch/BatchVideoFramesPanel";
import { ResizePanel } from "./resize/ResizePanel";
import { VideoFramesPanel } from "./video/VideoFramesPanel";

export type FeatureCategory = "image" | "video" | "batch";

export interface CategoryMetaItem {
  label: string;
  accent: string;
  description: string;
}

export type CategoryMetaMap = Record<FeatureCategory, CategoryMetaItem>;

export interface ImplementationStep {
  title: string;
  detail: string;
}

export interface FeatureDefinition {
  id: string;
  title: string;
  shortLabel: string;
  category: FeatureCategory;
  group: string;
  description: string;
  docsSummary: string;
  implementationSteps: ImplementationStep[];
  keywords: string[];
  render: () => ReactNode;
}

export function getCategoryMeta(language: Language): CategoryMetaMap {
  if (language === "zh") {
    return {
      image: {
        label: "图像",
        accent: "像素",
        description: "用于静态图片的缩放、转换，以及后续图像处理辅助功能。"
      },
      video: {
        label: "视频",
        accent: "帧流",
        description: "用于视频缩放、抽帧、帧率处理以及后续序列工作流。"
      },
      batch: {
        label: "批处理",
        accent: "队列",
        description: "用于未来的多文件流水线、重复任务和成组媒体处理。"
      }
    };
  }

  return {
    image: {
      label: "Image",
      accent: "Pixel",
      description: "Static figure preparation, resizing, conversion, and future annotation helpers."
    },
    video: {
      label: "Video",
      accent: "Motion",
      description: "Clip resizing, frame extraction, FPS conversion, and future sequence workflows."
    },
    batch: {
      label: "Batch",
      accent: "Queue",
      description: "Future multi-file pipelines, repeated jobs, and grouped media workflows."
    }
  };
}

export function getFeatureCatalog(language: Language): FeatureDefinition[] {
  const isZh = language === "zh";

  return [
    {
      id: "image-resize",
      title: isZh ? "图片缩放" : "Image Resize",
      shortLabel: isZh ? "缩放" : "Resize",
      category: "image",
      group: isZh ? "变换" : "Transform",
      description: isZh
        ? "默认支持强制缩放到目标尺寸，也可以选择保持原始比例并限制在目标框内。"
        : "Force images to an exact target size by default, or optionally keep aspect ratio and fit inside the target box.",
      docsSummary: isZh
        ? "使用 Pillow 打开图片，调用 Image.resize() 处理后，再把归一化结果保存到目标路径。"
        : "Open with Pillow, resize with Image.resize(), then save the normalized image to the requested path.",
      implementationSteps: [
        {
          title: isZh ? "解析并校验输入图片路径" : "Resolve and validate the input image path",
          detail: isZh
            ? "使用 Path(spec.input_path).expanduser() 处理路径，检查 input_path.exists()，并通过 ensure_parent_dir(output_path) 准备输出目录。"
            : "Use Path(spec.input_path).expanduser(), check input_path.exists(), and prepare the output folder with ensure_parent_dir(output_path)."
        },
        {
          title: isZh ? "从磁盘加载图片" : "Load the image from disk",
          detail: isZh
            ? "通过 Pillow 的 Image.open(input_path) 在上下文管理器中打开图片，确保源文件在处理后自动关闭。"
            : "Open the file with Pillow using Image.open(input_path) inside a context manager so the source file is closed automatically."
        },
        {
          title: isZh ? "使用 Pillow 执行缩放" : "Resize with Pillow",
          detail: isZh
            ? "调用 source.resize(..., Image.Resampling.LANCZOS)。如果开启保持比例，会先用 fit_within_box(...) 计算落在目标框内的输出尺寸。"
            : "Call source.resize(..., Image.Resampling.LANCZOS). If keepAspect is enabled, compute the fitted size first with fit_within_box(...)."
        },
        {
          title: isZh ? "保存前做格式归一化" : "Normalize the image before saving",
          detail: isZh
            ? "执行 _normalize_for_save(...)，让 JPEG 输出在源图包含 alpha 或调色板模式时先转换为 RGB。"
            : "Run _normalize_for_save(...) so JPEG outputs are converted to RGB when the source contains alpha or palette modes."
        },
        {
          title: isZh ? "写出最终图片" : "Write the resized image",
          detail: isZh
            ? "调用 final_image.save(output_path) 写回磁盘，并把最终宽高与 keepAspect 元数据返回给界面。"
            : "Save the final result with final_image.save(output_path), then return output width, height, and keepAspect metadata."
        }
      ],
      keywords: isZh
        ? ["图像", "图片", "缩放", "拉伸", "比例", "resize"]
        : ["image", "resize", "scale", "stretch", "aspect ratio", "figure"],
      render: () => (
        <ResizePanel
          language={language}
          taskKind="image_resize"
          title={isZh ? "图片缩放" : "Image Resize"}
          description={
            isZh
              ? "默认支持强制缩放到目标尺寸，也可以选择保持原始比例并限制在目标框内。"
              : "Force images to an exact target size by default, or optionally keep aspect ratio and fit inside the target box."
          }
          acceptedExtensions={["png", "jpg", "jpeg", "bmp", "tiff", "tif"]}
          outputHint={
            isZh
              ? "选择图片输出路径，例如 result.png 或 result.jpg。"
              : "Choose an image output path such as result.png or result.jpg."
          }
        />
      )
    },
    {
      id: "video-resize",
      title: isZh ? "视频缩放" : "Video Resize",
      shortLabel: isZh ? "缩放" : "Resize",
      category: "video",
      group: isZh ? "变换" : "Transform",
      description: isZh
        ? "默认支持强制缩放到目标尺寸，也可以选择保持原始比例并限制在目标框内，不加黑边。"
        : "Force videos to an exact target size by default, or optionally keep aspect ratio and fit inside the target box without padding.",
      docsSummary: isZh
        ? "先解析视频路径并计算目标尺寸，再用 ffmpeg 的 scale 过滤器配合 setsar=1 输出结果。"
        : "Resolve the video path, compute target dimensions, then run ffmpeg with a scale filter and setsar=1.",
      implementationSteps: [
        {
          title: isZh ? "解析并校验输入视频路径" : "Resolve and validate the input video path",
          detail: isZh
            ? "使用 Path(spec.input_path).expanduser() 处理路径，检查文件存在，并通过 ensure_parent_dir(output_path) 提前准备输出目录。"
            : "Use Path(spec.input_path).expanduser(), verify the file exists, and create the output directory ahead of time with ensure_parent_dir(output_path)."
        },
        {
          title: isZh ? "在保持比例时读取原始尺寸" : "Inspect source dimensions when aspect ratio must be preserved",
          detail: isZh
            ? "调用 get_video_dimensions(input_path) 和 fit_within_box(..., even=True)，保证比例正确且输出尺寸适合编码器。"
            : "Call get_video_dimensions(input_path) and fit_within_box(..., even=True) so the resized frame size stays proportional and encoder-friendly."
        },
        {
          title: isZh ? "确定最终输出尺寸" : "Choose the final output size",
          detail: isZh
            ? "强制缩放时直接使用请求宽高；保持比例时使用 fit_within_box(...) 计算出的宽高。"
            : "Use the requested width and height directly for forced resize, or the fitted width and height when keepAspect is enabled."
        },
        {
          title: isZh ? "构建 ffmpeg 过滤器" : "Build the ffmpeg video filter",
          detail: isZh
            ? "通过 _build_filter(...) 生成过滤器字符串，内部会执行 scale=width:height，并在后面追加 setsar=1。"
            : "Create the filter string with _build_filter(...), which applies scale=width:height and then setsar=1 for correct pixel display."
        },
        {
          title: isZh ? "渲染并保存输出视频" : "Render and save the resized video",
          detail: isZh
            ? "调用 run_ffmpeg([...]) 并传入 -vf filter_expression 与 -c:a copy，最终把尺寸和 ffmpeg 路径元数据返回给界面。"
            : "Call run_ffmpeg([...]) with -vf filter_expression and -c:a copy, then return the final size plus the ffmpeg binary path in metadata."
        }
      ],
      keywords: isZh
        ? ["视频", "缩放", "比例", "拉伸", "尺寸", "resize"]
        : ["video", "resize", "scale", "stretch", "aspect ratio", "movie", "clip"],
      render: () => (
        <ResizePanel
          language={language}
          taskKind="video_resize"
          title={isZh ? "视频缩放" : "Video Resize"}
          description={
            isZh
              ? "默认支持强制缩放到目标尺寸，也可以选择保持原始比例并限制在目标框内，不加黑边。"
              : "Force videos to an exact target size by default, or optionally keep aspect ratio and fit inside the target box without padding."
          }
          acceptedExtensions={["mp4", "mov", "mkv", "avi", "webm"]}
          outputHint={
            isZh
              ? "选择视频输出路径，例如 resized.mp4。"
              : "Choose a video output path such as resized.mp4."
          }
        />
      )
    },
    {
      id: "video-to-frames",
      title: isZh ? "视频转图片帧" : "Video to Frames",
      shortLabel: isZh ? "抽帧" : "Frames",
      category: "video",
      group: isZh ? "提取" : "Extract",
      description: isZh
        ? "把输入视频的每一帧提取出来，并保存成 PNG 图片序列到输出文件夹。"
        : "Extract every frame from a video and save the results as PNG images in an output folder.",
      docsSummary: isZh
        ? "先解析输出文件夹，然后用 ffmpeg 按 frame_%05d.png 的格式逐帧写出 PNG。"
        : "Resolve the output folder, then use ffmpeg to write each frame as frame_%05d.png.",
      implementationSteps: [
        {
          title: isZh ? "解析输入视频与输出文件夹" : "Resolve the input video and output folder",
          detail: isZh
            ? "使用 pathlib 展开输入与输出路径，确认视频存在，并通过 output_dir.mkdir(parents=True, exist_ok=True) 创建目标目录。"
            : "Expand the input and output paths with pathlib, verify the video exists, and create the destination folder with output_dir.mkdir(parents=True, exist_ok=True)."
        },
        {
          title: isZh ? "构建帧输出命名模板" : "Build the frame output pattern",
          detail: isZh
            ? "在目标文件夹中拼出 frame_%05d.png，让 ffmpeg 连续写出 frame_00001.png、frame_00002.png 这样的文件名。"
            : "Append frame_%05d.png inside the selected folder so ffmpeg writes sequential PNG files such as frame_00001.png."
        },
        {
          title: isZh ? "使用 ffmpeg 执行逐帧导出" : "Run ffmpeg for full-frame extraction",
          detail: isZh
            ? "调用 run_ffmpeg([...])，传入 -i 输入视频、-start_number 1 和 -vsync 0，让源视频时间线中的每一帧直接写成图片。"
            : "Call run_ffmpeg([...]) with -i input, -start_number 1, and -vsync 0 so frames are emitted directly from the source video timeline."
        },
        {
          title: isZh ? "返回输出目录和命名规则" : "Return the folder and naming metadata",
          detail: isZh
            ? "把输出文件夹路径返回给界面，同时在 metadata 里附带 filePattern 和 ffmpeg 路径。"
            : "Send the output folder path back to the UI and include the filePattern plus ffmpeg binary path in metadata."
        }
      ],
      keywords: isZh
        ? ["视频", "抽帧", "帧", "提取", "序列", "png", "ffmpeg"]
        : ["video", "frame", "frames", "extract", "png", "sequence", "ffmpeg"],
      render: () => <VideoFramesPanel language={language} />
    },
    {
      id: "batch-image-resize",
      title: isZh ? "批量图片缩放" : "Batch Image Resize",
      shortLabel: isZh ? "图片缩放" : "Image Resize",
      category: "batch",
      group: isZh ? "缩放" : "Resize",
      description: isZh
        ? "把指定文件夹里直接包含的 JPG 和 PNG 图片统一缩放到目标尺寸，并输出到另一个文件夹。"
        : "Resize all JPG and PNG images directly inside the selected folder and write the results into an output folder.",
      docsSummary: isZh
        ? "先扫描输入文件夹中的图片文件，再逐个复用现有 Image Resize 任务，把结果输出到目标文件夹。"
        : "Scan the input folder for image files, then reuse the existing Image Resize task for each file and write the results into the target folder.",
      implementationSteps: [
        {
          title: isZh ? "解析输入与输出文件夹" : "Resolve the input and output folders",
          detail: isZh
            ? "使用 pathlib 解析输入文件夹和输出文件夹，确认输入路径存在且是目录，并在必要时创建输出目录。"
            : "Resolve the input and output folders with pathlib, verify the input path is a directory, and create the output directory when needed."
        },
        {
          title: isZh ? "筛选当前支持的图片类型" : "Filter the currently supported image types",
          detail: isZh
            ? "遍历输入文件夹直接包含的文件，只保留 .jpg、.jpeg 和 .png。"
            : "Iterate through files directly inside the input folder and keep only .jpg, .jpeg, and .png files."
        }
      ],
      keywords: isZh
        ? ["批处理", "图片", "文件夹", "缩放", "jpg", "png"]
        : ["batch", "image", "folder", "resize", "jpg", "png"],
      render: () => (
        <BatchResizePanel
          language={language}
          taskKind="batch_image_resize"
          title={isZh ? "批量图片缩放" : "Batch Image Resize"}
          description={
            isZh
              ? "把所选文件夹里直接包含的 JPG 和 PNG 图片统一缩放到指定尺寸，并写到输出文件夹。"
              : "Resize JPG and PNG images directly inside the selected folder and write the results into the output folder."
          }
          acceptedExtensions={["jpg", "jpeg", "png"]}
          outputHint={
            isZh
              ? "输出文件夹里会生成与原文件同名的缩放结果。"
              : "The output folder will receive resized files using the original filenames."
          }
          submitLabel={isZh ? "开始批量图片缩放" : "Run Batch Image Resize"}
          runningLabel={isZh ? "批量处理中..." : "Processing batch..."}
        />
      )
    },
    {
      id: "batch-video-resize",
      title: isZh ? "批量视频缩放" : "Batch Video Resize",
      shortLabel: isZh ? "视频缩放" : "Video Resize",
      category: "batch",
      group: isZh ? "缩放" : "Resize",
      description: isZh
        ? "把指定文件夹里直接包含的 MP4 视频统一缩放到目标尺寸，并输出到另一个文件夹。"
        : "Resize all MP4 videos directly inside the selected folder and write the results into an output folder.",
      docsSummary: isZh
        ? "先扫描输入文件夹中的 MP4 视频，再逐个复用现有 Video Resize 任务完成批处理。"
        : "Scan the input folder for MP4 videos, then reuse the existing Video Resize task for each file.",
      implementationSteps: [
        {
          title: isZh ? "准备批处理目录" : "Prepare the batch directories",
          detail: isZh
            ? "检查输入目录是否合法，确保输出目录存在，然后把后续结果统一写入目标文件夹。"
            : "Validate the input directory, ensure the output directory exists, and write all results into that target folder."
        },
        {
          title: isZh ? "逐个复用单文件视频缩放任务" : "Reuse the single-file video resize task for each file",
          detail: isZh
            ? "对输入目录下直接包含的每个 .mp4 文件构造一个子任务，并沿用现有 ffprobe + ffmpeg 缩放链路。"
            : "Build a child task for each .mp4 file directly inside the input directory and reuse the existing ffprobe + ffmpeg resize pipeline."
        }
      ],
      keywords: isZh
        ? ["批处理", "视频", "文件夹", "缩放", "mp4"]
        : ["batch", "video", "folder", "resize", "mp4"],
      render: () => (
        <BatchResizePanel
          language={language}
          taskKind="batch_video_resize"
          title={isZh ? "批量视频缩放" : "Batch Video Resize"}
          description={
            isZh
              ? "把所选文件夹里直接包含的 MP4 视频统一缩放到指定尺寸，并写到输出文件夹。"
              : "Resize MP4 videos directly inside the selected folder and write the results into the output folder."
          }
          acceptedExtensions={["mp4"]}
          outputHint={
            isZh
              ? "输出文件夹里会生成与原视频同名的缩放结果。"
              : "The output folder will receive resized videos using the original filenames."
          }
          submitLabel={isZh ? "开始批量视频缩放" : "Run Batch Video Resize"}
          runningLabel={isZh ? "批量处理中..." : "Processing batch..."}
        />
      )
    },
    {
      id: "batch-video-to-frames",
      title: isZh ? "批量视频抽帧" : "Batch Video to Frames",
      shortLabel: isZh ? "视频抽帧" : "Video to Frames",
      category: "batch",
      group: isZh ? "提取" : "Extract",
      description: isZh
        ? "把指定文件夹里直接包含的 MP4 视频全部抽帧，并在输出目录下为每个视频建立同名子文件夹。"
        : "Extract frames from all MP4 videos directly inside the selected folder and create a same-name subfolder for each video under the output directory.",
      docsSummary: isZh
        ? "先扫描输入文件夹中的 MP4 视频，再逐个复用现有 Video to Frames 任务，把每个视频的帧写入独立子目录。"
        : "Scan the input folder for MP4 videos, then reuse the existing Video to Frames task so each video writes frames into its own subfolder.",
      implementationSteps: [
        {
          title: isZh ? "筛选 MP4 输入视频" : "Filter MP4 input videos",
          detail: isZh
            ? "遍历输入目录下直接包含的文件，只保留 .mp4 文件作为抽帧输入。"
            : "Iterate through files directly inside the input directory and keep only .mp4 files as frame-extraction inputs."
        },
        {
          title: isZh ? "为每个视频创建单独输出目录" : "Create a dedicated output folder for each video",
          detail: isZh
            ? "针对每个视频，使用其文件名去掉 .mp4 后缀后的内容作为子目录名，例如 clip.mp4 会对应输出目录 clip/。"
            : "For each video, create a subfolder named after the file stem, so clip.mp4 writes into clip/."
        }
      ],
      keywords: isZh
        ? ["批处理", "视频", "抽帧", "文件夹", "mp4", "png"]
        : ["batch", "video", "frames", "extract", "folder", "mp4", "png"],
      render: () => (
        <BatchVideoFramesPanel
          language={language}
          title={isZh ? "批量视频抽帧" : "Batch Video to Frames"}
          description={
            isZh
              ? "把所选文件夹里直接包含的 MP4 视频全部抽帧，并在输出目录下为每个视频建立同名子文件夹。"
              : "Extract frames from MP4 videos directly inside the selected folder and create a same-name subfolder for each video under the output directory."
          }
          outputHint={
            isZh
              ? "输出目录下会按每个视频名创建子文件夹，并把对应帧序列写进去。"
              : "The output directory will create one subfolder per video and write that video's frame sequence inside it."
          }
          submitLabel={isZh ? "开始批量抽帧" : "Run Batch Video to Frames"}
          runningLabel={isZh ? "批量抽帧中..." : "Extracting batch frames..."}
        />
      )
    }
  ];
}

export function matchesFeatureSearch(feature: FeatureDefinition, query: string) {
  const haystack = [
    feature.title,
    feature.shortLabel,
    feature.category,
    feature.group,
    feature.description,
    feature.docsSummary,
    ...feature.implementationSteps.flatMap((step) => [step.title, step.detail]),
    ...feature.keywords
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}
