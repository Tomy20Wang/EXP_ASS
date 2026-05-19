export type Language = "en" | "zh";

export const LANGUAGE_STORAGE_KEY = "exp_ass.ui.language";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === "zh" ? "zh" : "en";
}

export const appText = {
  en: {
    sidebar: {
      title: "Open EXP_ASS",
      subtitle: "Search or browse the tool tree to open a workspace on the right.",
      project: "Project",
      toolkit: "Toolkit",
      quickSearch: "Quick Search",
      searchPlaceholder: "Search tools",
      searchHelper: "Search suggestions stay independent from the tree below.",
      suggestions: "Suggestions",
      noSuggestions: "No matching tools.",
      searchPrompt: "Type a keyword to show matching tools.",
      toolTree: "Tool Tree",
      settings: "Settings",
    },
    workspace: {
      open: "Open EXP_ASS",
      implementationNote: "Implementation Note",
      viewAllSteps: "View all steps",
      implementationSteps: "Implementation Steps",
      close: "Close",
    },
    settings: {
      title: "Settings",
      description: "Choose the interface language for the desktop toolkit.",
      language: "Language",
      english: "English",
      chinese: "简体中文",
    },
    forms: {
      browse: "Browse",
      output: "Output",
      resize: {
        inputPath: "Input Path",
        outputPath: "Output Path",
        selectLocalFile: "Select a local file",
        acceptedTypes: "Accepted types",
        width: "Width",
        height: "Height",
        preserveAspect: "Preserve aspect ratio",
        preserveAspectHint:
          "Unchecked: force exact {size} output and allow distortion. Checked: fit inside the target box without padding, using the long edge as the limiting side.",
        run: "Run Resize",
        running: "Processing...",
        missingPaths: "Please choose both an input path and an output path.",
        invalidSize: "Width and height must both be positive integers.",
      },
      videoFrames: {
        inputVideo: "Input Video",
        outputFolder: "Output Folder",
        selectLocalVideo: "Select a local video file",
        chooseFolder: "Choose a folder such as sample_frames",
        acceptedTypes: "Accepted types",
        framePatternHint: "Frames will be written into this folder as {pattern}.",
        run: "Extract Frames",
        running: "Extracting...",
        missingPaths: "Please choose both an input video path and an output folder.",
      },
      batch: {
        inputFolder: "Input Folder",
        outputFolder: "Output Folder",
        selectInputFolder: "Select a source folder",
        selectOutputFolder: "Select an output folder",
        acceptedTypes: "Accepted types",
        missingPaths: "Please choose both an input folder and an output folder.",
        directChildrenHint: "This batch mode currently processes supported files directly inside the selected folder.",
        progress: "Progress",
        currentItem: "Current File",
      },
      placeholder: {
        ready: "This category is ready for future tools.",
      },
    },
  },
  zh: {
    sidebar: {
      title: "打开 EXP_ASS",
      subtitle: "可以通过搜索或左侧工具树，在右边打开对应功能工作区。",
      project: "项目",
      toolkit: "工具集",
      quickSearch: "快速搜索",
      searchPlaceholder: "搜索功能",
      searchHelper: "搜索建议与下面的树形导航相互独立。",
      suggestions: "搜索建议",
      noSuggestions: "没有匹配功能。",
      searchPrompt: "输入关键词后，这里会显示匹配工具。",
      toolTree: "工具树",
      settings: "设置",
    },
    workspace: {
      open: "打开 EXP_ASS",
      implementationNote: "实现说明",
      viewAllSteps: "查看全部步骤",
      implementationSteps: "实现步骤",
      close: "关闭",
    },
    settings: {
      title: "设置",
      description: "选择桌面工具界面的显示语言。",
      language: "语言",
      english: "English",
      chinese: "简体中文",
    },
    forms: {
      browse: "浏览",
      output: "输出",
      resize: {
        inputPath: "输入路径",
        outputPath: "输出路径",
        selectLocalFile: "选择本地文件",
        acceptedTypes: "支持类型",
        width: "宽度",
        height: "高度",
        preserveAspect: "保持原始比例",
        preserveAspectHint:
          "未勾选：强制输出为 {size}，允许拉伸变形。已勾选：保持比例缩放到目标框内，不补边，以长边为限制。",
        run: "执行缩放",
        running: "处理中...",
        missingPaths: "请选择输入路径和输出路径。",
        invalidSize: "宽度和高度都必须是正整数。",
      },
      videoFrames: {
        inputVideo: "输入视频",
        outputFolder: "输出文件夹",
        selectLocalVideo: "选择本地视频文件",
        chooseFolder: "选择一个文件夹，例如 sample_frames",
        acceptedTypes: "支持类型",
        framePatternHint: "导出的帧会按 {pattern} 命名并写入这个文件夹。",
        run: "开始抽帧",
        running: "抽帧中...",
        missingPaths: "请选择输入视频路径和输出文件夹。",
      },
      batch: {
        inputFolder: "输入文件夹",
        outputFolder: "输出文件夹",
        selectInputFolder: "选择源文件夹",
        selectOutputFolder: "选择输出文件夹",
        acceptedTypes: "支持类型",
        missingPaths: "请选择输入文件夹和输出文件夹。",
        directChildrenHint: "当前批处理模式会处理所选文件夹内直接包含的支持文件。",
        progress: "进度",
        currentItem: "当前文件",
      },
      placeholder: {
        ready: "这个分类已经预留好，后续可以继续添加批处理工具。",
      },
    },
  },
} as const;

export type AppText = typeof appText.en;

export function getAppText(language: Language) {
  return appText[language];
}
