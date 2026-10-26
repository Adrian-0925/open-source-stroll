/* Original Chinese usage notes, checked against the linked official sources. */
window.STROLL_PROJECT_NOTES = {
  'opencv/opencv': {
    category: '开发工具', title: '给程序加上处理图像的能力',
    description: '在代码中处理照片和视频，完成图像变换、特征识别等视觉任务。',
    tags: ['需要编程', '视觉开发'], access: 'developer',
    note: '这是计算机视觉开发库，需要编写代码并配置开发环境。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/opencv/opencv'], editorialCheckedAt: '2026-10-25'
  },
  'roboflow/supervision': {
    category: '开发工具', title: '把检测结果，变成标注和追踪',
    description: '为图片或视频中的检测结果添加标注，追踪目标并统计数量。',
    tags: ['需要编程', 'Python'], access: 'developer',
    note: '需要 Python 和相应的检测模型；它提供处理检测结果的组件。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/roboflow/supervision'], editorialCheckedAt: '2026-10-25'
  },
  'ocrmypdf/ocrmypdf': {
    category: '文字识别', title: '让扫描 PDF，也能搜索文字',
    description: '给扫描版 PDF 补上文字层，让旧资料也能搜索和复制文字。',
    tags: ['需要命令行', '处理 PDF'], access: 'command',
    note: '需要安装 OCRmyPDF 及识别组件，中文材料还需相应语言包；识别后请检查错字。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/ocrmypdf/OCRmyPDF'], editorialCheckedAt: '2026-10-25'
  },
  'lovell/sharp': {
    category: '开发工具', title: '在程序里，批量缩放和转换图片',
    description: '自动缩放图片、转换格式和生成缩略图，适合接入网站或应用。',
    tags: ['需要编程', 'Node.js'], access: 'developer',
    note: '这是 Node.js 图像处理模块，需要在代码中调用。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/lovell/sharp'], editorialCheckedAt: '2026-10-25'
  },
  'graphiteeditor/graphite': {
    category: '设计工具', title: '在浏览器里，试试矢量绘图',
    description: '画矢量图、用节点调整设计，打开官方网页就能在电脑上尝试。',
    tags: ['网页可用', '矢量设计'], access: 'web',
    note: '官方提供网页编辑器，推荐使用电脑浏览器；项目仍在开发，开始前可先看入门教程。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/GraphiteEditor/Graphite', 'https://graphite.art/'], editorialCheckedAt: '2026-10-25'
  },
  'siyuan-note/siyuan': {
    name: '思源笔记', category: '笔记整理', title: '把零散笔记，连成自己的知识库',
    description: '用内容块和双向链接整理资料，也能记大纲、做标注，适合长期积累个人笔记。',
    tags: ['有安装包', '本地笔记'], access: 'app',
    note: '桌面和手机均有安装入口。部分同步等服务需要付费，具体以官方说明为准。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/siyuan-note/siyuan'], editorialCheckedAt: '2026-10-26'
  },
  'lfnovo/open-notebook': {
    name: 'Open Notebook', category: '资料研究', title: '带着自己的资料，向 AI 提问',
    description: '收集 PDF、网页和音视频，围绕这些材料检索、提问和记笔记，适合整理研究资料。',
    tags: ['需要自行部署', '需配置模型'], access: 'self-hosted',
    note: '官方快速开始需要 Docker，并连接云端模型或本地模型。云端 API 可能收费，本地模型也需要相应硬件。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/lfnovo/open-notebook'], editorialCheckedAt: '2026-10-26'
  },
  'triliumnext/trilium': {
    category: '笔记整理', title: '用树状笔记，整理长久积累的资料',
    description: '把笔记按层级归类，再用链接串起相关内容，适合搭建结构清楚的个人知识库。',
    tags: ['有桌面版', '可自行部署'], access: 'app',
    note: '可先安装桌面版使用；通过手机浏览器访问或跨设备同步时，需要配置相应服务。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/TriliumNext/Trilium'], editorialCheckedAt: '2026-10-26'
  },
  'appflowy-io/appflowy': {
    category: '协作办公', title: '把文档和项目进度，放在一个工作区',
    description: '把文档、知识库和项目进度放在一起，适合整理团队资料和跟进手头的工作。',
    tags: ['有安装包', '可自行部署'], access: 'app',
    note: '可先从官方安装包开始；云服务和 AI 功能受套餐限制，具体以官方说明为准。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/AppFlowy-IO/AppFlowy', 'https://appflowy.com/pricing'], editorialCheckedAt: '2026-10-26'
  },
  'usememos/memos': {
    name: 'Memos', category: '随手记录', title: '随手记下想法，需要时再找回来',
    description: '用时间线和标签收好日常想法，选择哪些只留给自己、哪些可以分享。',
    tags: ['需要自行部署', '浏览器使用'], access: 'self-hosted',
    note: '需要运行自己的服务并维护备份，Docker 是一种安装方式；部署后通过浏览器使用。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/usememos/memos'], editorialCheckedAt: '2026-10-26'
  },
  'logseq/logseq': {
    name: 'Logseq', category: '笔记整理', title: '用大纲和链接，串起读过与想过的事',
    description: '把知识笔记、PDF 批注和待办事项收在一起，用大纲和链接梳理思路。',
    tags: ['有安装包', '大纲笔记'], access: 'app',
    note: '官方提供安装入口；新版 DB 仍处于测试阶段，建议先用测试图谱并定期备份。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/logseq/logseq'], editorialCheckedAt: '2026-10-26'
  },
  'danielgatis/rembg': {
    category: '图片处理', title: '去掉照片背景，留下主体',
    description: '自动去除图片背景，也能批量处理文件夹，方便制作透明底素材。',
    tags: ['需要命令行', '批量去背景'], access: 'command',
    note: '需要 Python 环境，可通过命令行或代码使用；首次运行会下载模型，边缘细节需要检查。用途说明依据官方资料整理，未逐个安装测试。',
    editorialSources: ['https://github.com/danielgatis/rembg'], editorialCheckedAt: '2026-10-25'
  }
};
