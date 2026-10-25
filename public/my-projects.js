// Public repositories checked against GitHub on 2026-10-25. Kept separate from the daily feed.
window.STROLL_MY_PROJECTS = [
  {
    id: 'phonepulse', name: 'PhonePulse', mark: 'P', kind: '个人项目',
    category: 'iPhone 工具', license: 'GPL-3.0',
    description: '查看 iPhone 的实时网速、充电功率估算和手机状态，也能用画中画悬浮显示网速。',
    note: '适用于 iOS 17 及以上，安装方式见仓库说明。',
    links: [{ label: '查看项目', url: 'https://github.com/Adrian-0925/phonepulse' }]
  },
  {
    id: 'stroll', name: '开源散步', mark: '散', kind: '个人项目',
    category: '网站', license: 'MIT',
    description: '每天一小份，用简短中文发现用得上的开源好工具。支持往日推荐和本机收藏。',
    links: [
      { label: '在线体验', url: 'https://open-source-stroll.tealbuddy129.chatgpt.site' },
      { label: 'GitHub 源码', url: 'https://github.com/Adrian-0925/open-source-stroll' }
    ]
  },
  {
    id: 'tokentracker', name: 'TokenTracker', mark: 'T', kind: 'Fork 分支',
    category: 'AI 编程用量', license: 'MIT',
    description: '在本地查看 AI 编程工具的 Token 用量、费用和活动趋势。这里是我保存的个人 Fork。',
    upstream: { name: 'xiufengsun/TokenTracker', url: 'https://github.com/xiufengsun/TokenTracker' },
    links: [{ label: '查看我的分支', url: 'https://github.com/Adrian-0925/TokenTracker' }]
  }
];
