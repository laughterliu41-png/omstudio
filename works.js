// 本地素材放入 assets，修改下方路径。video 是点开播放的版本，detailImage 可指定高清大图。
const projects = {
  city: {
    cover: 'assets/city.webp', poster: 'assets/city-poster.webp', video: 'assets/city.mp4', alt: '车窗雨水与夜色中的街道',
    tag: '城市短片 · 拍摄与剪辑', title: '城市慢帧', type: '拍摄与剪辑 · 概念样片', description: '雨夜通勤短片，用车窗上的雨滴和掠过的街灯组织画面节奏。' },
  scent: {
    cover: 'assets/scent.webp', poster: 'assets/scent-poster.webp', video: 'assets/scent.mp4', alt: '黑色香水瓶在岩石上被侧光照亮',
    tag: '产品影像 · 灯光与后期', title: '光的边缘', type: '产品影像 · 概念样片', description: '香水产品短片，用侧光勾勒瓶身轮廓，带出玻璃和底座的质感。' },
  print: {
    cover: 'assets/print.webp', alt: '黑白字体海报和折页印刷物',
    tag: '平面设计 · 品牌视觉', title: '留白档案', type: '平面与品牌视觉 · 概念案例', description: '为独立展览设计一套黑白视觉。把展名、日期与地点分出清晰层级，再用同一套网格延展到主海报、折页与社交媒体。' },
  digital: {
    cover: 'assets/digital.webp', alt: '笔记本电脑与手机上的黑白数字界面',
    tag: 'UI／UX · 网站体验', title: '场域', type: 'UI／UX · 概念案例', description: '为独立展览构想一个响应式网站。首页用大图展示展览主题，详情中集中展示开放时间、地址与参观信息，并保留清晰的移动端预约入口。' },
};
