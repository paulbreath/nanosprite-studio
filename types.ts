
export enum Perspective {
  SIDE = 'side',
  TOP_DOWN = 'top_down',
  ISOMETRIC = 'isometric',
  FRONT = 'front',
  DIAGONAL_45 = 'diagonal_45'
}

export enum Style {
  PIXEL_ART_16BIT = 'pixel_art_16bit',
  PIXEL_ART_32BIT = 'pixel_art_32bit',
  VECTOR_FLAT = 'vector_flat',
  HAND_DRAWN_INK = 'hand_drawn_ink',
  CHIBI_CUTE = 'chibi_cute',
  CYBERPUNK_NEON = 'cyberpunk_neon',
  DARK_FANTASY = 'dark_fantasy',
  ANIME_CEL_SHADED = 'anime_cel_shaded',
  RETRO_GAMEBOY = 'retro_gameboy',
  LOW_POLY_3D = 'low_poly_3d',
  VOXEL_ART = 'voxel_art',
  STUDIO_GHIBLI = 'studio_ghibli',
  PAPER_CUTOUT = 'paper_cutout',
  CLAYMATION = 'claymation',
  OIL_PAINTING = 'oil_painting',
  SYNTHWAVE = 'synthwave',
  ANIME_MANGA = 'anime_manga',
  CHINESE_INK = 'chinese_ink',
  WATERCOLOR = 'watercolor',
  JAPANESE_CARTOON = 'japanese_cartoon',
  AMERICAN_COMIC = 'american_comic'
}

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
  flipped?: boolean; // 新增：是否水平翻转
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SpriteSheetData {
  imageUrl: string;
  prompt: string;
  perspective: Perspective;
  style: Style;
  timestamp: number;
  customRects?: FrameRect[];
}

export type Language = 'en' | 'zh';

export const TRANSLATIONS = {
  en: {
    title: 'NanoSprite Studio',
    subtitle: 'PROFESSIONAL SPRITE WORKSTATION',
    tabs: {
      forge: 'Forge',
      lab: 'Workbench',
      agent: 'AI Consultant',
      cinema: 'Cinema'
    },
    library: {
      title: 'Motion Templates',
      idle: 'Idle Cycle',
      run: 'Run Cycle',
      attack: 'Attack/Slash',
      jump: 'Jump/Fall',
      custom: 'Custom Guide'
    },
    changeKey: 'Manage Key',
    engineStatus: 'Engine Status',
    statusConnected: 'Online',
    statusDisconnected: 'Key Required',
    uploadBtn: 'Import Sheet',
    guideBtn: 'Upload Guide',
    promptLabel: 'Asset Description',
    aspectLabel: 'Canvas',
    styleLabel: 'Visual Style',
    perspectiveLabel: 'Perspective',
    modelLabel: 'Generator Engine',
    generateBtn: 'Forge Asset',
    downloadBtn: 'Export PNG',
    veoBtn: 'Render Motion',
    smartSliceBtn: 'AI Smart Align',
    smartAlignRef: 'Sync to Anchor',
    refineBtn: 'AI Smart Fix (Pose & Direction)',
    flipLabel: 'Flip Horizontal',
    outlineToggle: 'Outline',
    hitboxToggle: 'Hitbox',
    transparentBgLabel: 'Transparent Alpha',
    zoomLabel: 'Preview Zoom',
    agentPlaceholder: 'Ask for prompt optimization or animation tips...',
    masterSheet: 'MASTER SPRITE SHEET',
    tuning: {
      global: 'Alignment',
      perFrame: 'Frame Boundary (F{n})',
      onionSkin: 'Ghosting',
      guides: 'Grid',
      anchor: 'Horizon',
      width: 'W',
      height: 'H',
      posX: 'X',
      posY: 'Y'
    },
    perspectives: {
      [Perspective.SIDE]: 'Side Profile',
      [Perspective.TOP_DOWN]: 'Birds-eye',
      [Perspective.ISOMETRIC]: 'Isometric',
      [Perspective.FRONT]: 'Frontal',
      [Perspective.DIAGONAL_45]: '3/4 Perspective'
    },
    styles: {
      [Style.PIXEL_ART_16BIT]: '16-bit Pixel Art',
      [Style.PIXEL_ART_32BIT]: '32-bit Pixel Art',
      [Style.VECTOR_FLAT]: 'Flat Vector',
      [Style.HAND_DRAWN_INK]: 'Hand-drawn Ink',
      [Style.CHIBI_CUTE]: 'Cute Chibi',
      [Style.CYBERPUNK_NEON]: 'Cyberpunk Neon',
      [Style.DARK_FANTASY]: 'Dark Fantasy',
      [Style.ANIME_CEL_SHADED]: 'Anime Cel-shaded',
      [Style.RETRO_GAMEBOY]: 'Retro GameBoy',
      [Style.LOW_POLY_3D]: 'Low-poly 3D',
      [Style.VOXEL_ART]: 'Voxel Art',
      [Style.STUDIO_GHIBLI]: 'Studio Ghibli',
      [Style.PAPER_CUTOUT]: 'Paper Cutout',
      [Style.CLAYMATION]: 'Claymation',
      [Style.OIL_PAINTING]: 'Oil Painting',
      [Style.SYNTHWAVE]: 'Synthwave',
      [Style.ANIME_MANGA]: 'Modern Anime/Manga',
      [Style.CHINESE_INK]: 'Chinese Ink Wash',
      [Style.WATERCOLOR]: 'Vibrant Watercolor',
      [Style.JAPANESE_CARTOON]: 'Classic Japanese Cartoon',
      [Style.AMERICAN_COMIC]: 'Vintage American Comic'
    },
    models: {
      flash: 'Nano Banana (2.5 Flash)',
      pro: 'Pro Artist (3.0 Pro - High Precision)'
    }
  },
  zh: {
    title: 'Nano 精灵工坊',
    subtitle: '专业级 8 帧动画工作站',
    tabs: {
      forge: '资源锻造',
      lab: '动画精修',
      agent: 'AI 顾问',
      cinema: '动态预览'
    },
    library: {
      title: '姿态模板库',
      idle: '呼吸待机',
      run: '标准奔跑',
      attack: '挥砍/攻击',
      jump: '跳跃/落地',
      custom: '自定义参考'
    },
    changeKey: '密钥管理',
    engineStatus: '引擎状态',
    statusConnected: '已就绪',
    statusDisconnected: '未授权',
    uploadBtn: '导入本地图集',
    guideBtn: '上传自定义',
    promptLabel: '资源描述 (Prompt)',
    aspectLabel: '画布比例',
    styleLabel: '艺术风格',
    perspectiveLabel: '观察视角',
    modelLabel: '绘图引擎',
    generateBtn: '开始锻造',
    downloadBtn: '导出图集',
    veoBtn: '生成电影动态',
    smartSliceBtn: 'AI 智能对齐',
    smartAlignRef: '重心同步',
    refineBtn: 'AI 姿态修正 (解决朝向/动作错误)',
    flipLabel: '水平翻转 (镜像)',
    outlineToggle: '智能描边',
    hitboxToggle: '碰撞体预览',
    transparentBgLabel: '开启透明背景',
    zoomLabel: '预览缩放',
    agentPlaceholder: '询问如何优化角色动画或视角...',
    masterSheet: '主精灵图集',
    tuning: {
      global: '全局对齐',
      perFrame: '单帧校准 (第 {n} 帧)',
      onionSkin: '残影模式',
      guides: '参考线',
      anchor: '地平线',
      width: '宽',
      height: '高',
      posX: '横向',
      posY: '纵向'
    },
    perspectives: {
      [Perspective.SIDE]: '纯侧视图',
      [Perspective.TOP_DOWN]: '上帝视角',
      [Perspective.ISOMETRIC]: '等轴测',
      [Perspective.FRONT]: '纯正视图',
      [Perspective.DIAGONAL_45]: '45度斜视角'
    },
    styles: {
      [Style.PIXEL_ART_16BIT]: '16位复古像素',
      [Style.PIXEL_ART_32BIT]: '32位高清像素',
      [Style.VECTOR_FLAT]: '矢量扁平',
      [Style.HAND_DRAWN_INK]: '手绘墨水',
      [Style.CHIBI_CUTE]: 'Q版可爱',
      [Style.CYBERPUNK_NEON]: '赛博霓虹',
      [Style.DARK_FANTASY]: '暗黑幻想',
      [Style.ANIME_CEL_SHADED]: '卡通赛璐璐',
      [Style.RETRO_GAMEBOY]: '复古掌机',
      [Style.LOW_POLY_3D]: '低多边形',
      [Style.VOXEL_ART]: '体素方块',
      [Style.STUDIO_GHIBLI]: '吉卜力画风',
      [Style.PAPER_CUTOUT]: '剪纸艺术',
      [Style.CLAYMATION]: '黏土定格',
      [Style.OIL_PAINTING]: '写意油画',
      [Style.SYNTHWAVE]: '合成器波',
      [Style.ANIME_MANGA]: '二次元/现代日漫',
      [Style.CHINESE_INK]: '中国水墨风',
      [Style.WATERCOLOR]: '艺术水彩风',
      [Style.JAPANESE_CARTOON]: '日式经典卡通',
      [Style.AMERICAN_COMIC]: '美式漫画/波普'
    },
    models: {
      flash: 'Nano Banana (2.5 Flash - 快速)',
      pro: 'Pro Artist (3.0 Pro - 极高精度)'
    }
  }
};
