/* Original editorial copy. Sources checked against the official repositories on 2026-10-24. */
window.STROLL_CONTENT = {
  editions: [{ id: '2026-10-24', number: '01', title: '把日常的小麻烦，交给开源。', subtitle: '传文件、提取文字、整理照片。第一期，从身边的小事开始。', projects: ['localsend', 'umi', 'sharex', 'upscayl', 'vtracer', 'czkawka'] }],
  projects: {
    localsend: { name: 'LocalSend', repo: 'localsend/localsend', category: '文件传输', title: '手机和电脑，轻松互传文件', description: '照片、视频、文档，在同一局域网里的设备间直接传。不用先发给聊天软件，再下载一次。', tags: ['多平台', '无需账号'], note: '两台设备都要安装，并连接同一局域网。', art: 'send', color: 'sage' },
    umi: { name: 'Umi-OCR', repo: 'hiroi-sora/Umi-OCR', category: '文字识别', title: '图片里的文字，不必再手打', description: '截个图就能提取文字，也能批量识别图片、处理扫描 PDF。断网时，一样可以用。', tags: ['Windows / Linux', '离线使用'], note: '识别后仍需检查错字和复杂排版。', art: 'text', color: 'cream' },
    sharex: { name: 'ShareX', repo: 'ShareX/ShareX', category: '截图录屏', title: '截张图，顺手把重点讲清楚', description: '框选截图、画箭头、打马赛克，或录一段 GIF。做教程、反馈问题时，少切换几个工具。', tags: ['Windows', '有安装包'], note: '功能较多，初次使用建议先设置截图快捷键。', art: 'capture', color: 'blue' },
    upscayl: { name: 'Upscayl', repo: 'upscayl/upscayl', category: '图片处理', title: '给小尺寸图片，多一点清晰', description: '在电脑本地，用 AI 放大低分辨率图片。老插画、素材小图，可以拿来试一试。', tags: ['多平台', '本地处理'], note: '需要支持 Vulkan 的显卡，效果取决于原图。', art: 'image', color: 'rose' },
    vtracer: { name: 'VTracer', repo: 'visioncortex/vtracer', category: '设计工具', title: '把像素小图，变成流畅线条', description: '将位图转换成 SVG 矢量图。处理图标、简单插画和线稿时，放大后也能保持边缘利落。', tags: ['网页演示', '矢量转换'], note: '复杂照片不一定合适；命令行使用有一定门槛。', art: 'vector', color: 'lilac' },
    czkawka: { name: 'Czkawka', repo: 'qarmin/czkawka', category: '文件整理', title: '重复的文件，终于能找出来', description: '找出重复文件、相似图片和空文件夹。给积攒许久的下载目录，做一次有条理的整理。', tags: ['多平台', '本地扫描'], note: '仓库提供多个界面版本；删除前请核对并备份。', art: 'files', color: 'sand' }
  }
};
