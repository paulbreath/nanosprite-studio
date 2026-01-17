
import { GoogleGenAI, Type } from "@google/genai";
import { Perspective, Style, FrameRect, ChatMessage } from "../types";

const perspectivePromptMap: Record<Perspective, string> = {
  [Perspective.SIDE]: 'Full Side-view profile',
  [Perspective.TOP_DOWN]: 'Top-down birds-eye view',
  [Perspective.ISOMETRIC]: 'Isometric 45-degree 3/4 view',
  [Perspective.FRONT]: 'Direct flat front-view',
  [Perspective.DIAGONAL_45]: 'Diagonal 3/4 perspective'
};

const stylePromptMap: Record<Style, string> = {
  [Style.PIXEL_ART_16BIT]: '16-bit retro Pixel Art, crisp edges, limited palette',
  [Style.PIXEL_ART_32BIT]: 'Modern 32-bit Pixel Art, smooth gradients, high detail',
  [Style.VECTOR_FLAT]: 'Clean flat vector illustration, bold outlines',
  [Style.HAND_DRAWN_INK]: 'Hand-drawn ink sketch style, cross-hatching',
  [Style.CHIBI_CUTE]: 'Cute Chibi style, big head, small body',
  [Style.CYBERPUNK_NEON]: 'Cyberpunk aesthetic, neon glows, high contrast',
  [Style.DARK_FANTASY]: 'Grimdark fantasy, moody shadows, muted colors',
  [Style.ANIME_CEL_SHADED]: 'Modern Anime style, cel-shading, vibrant',
  [Style.RETRO_GAMEBOY]: 'GameBoy 4-color green palette, pixelated',
  [Style.LOW_POLY_3D]: 'Low-poly 3D render aesthetic, flat shaded facets',
  [Style.VOXEL_ART]: 'Voxel block-based 3D art style',
  [Style.STUDIO_GHIBLI]: 'Hand-painted whimsical Ghibli-inspired art',
  [Style.PAPER_CUTOUT]: 'Layered paper-cut craft style, depth shadows',
  [Style.CLAYMATION]: 'Clay stop-motion style, organic textures',
  [Style.OIL_PAINTING]: 'Impressionist oil painting, thick textures',
  [Style.SYNTHWAVE]: '80s Synthwave, retro-future, grid aesthetic',
  [Style.ANIME_MANGA]: 'Modern high-quality anime and manga style, sharp lines, detailed eyes, vibrant cel-shading',
  [Style.CHINESE_INK]: 'Traditional Chinese ink wash painting, elegant brushwork, black and grey tones with subtle artistic colors, zen aesthetic',
  [Style.WATERCOLOR]: 'Soft artistic watercolor painting, bleeding colors, textured paper, fluid strokes and vibrant hues',
  [Style.JAPANESE_CARTOON]: 'Classic 90s Japanese cartoon style, thick outlines, expressive features, retro animation vibe',
  [Style.AMERICAN_COMIC]: 'Vintage American comic book style, Ben-Day dots, heavy ink lines, dynamic shadows, pop art aesthetic'
};

const normalizeBase64 = (base64: string): string => {
  if (!base64) return "";
  let raw = base64;
  if (raw.includes('base64,')) {
    raw = raw.split('base64,')[1];
  }
  let clean = raw.replace(/[^A-Za-z0-9+/_-]/g, '');
  clean = clean.replace(/-/g, '+').replace(/_/g, '/');
  const padNeeded = (4 - (clean.length % 4)) % 4;
  return clean + '='.repeat(padNeeded);
};

/**
 * 创建一个 4x2 的网格占位图 Base64。
 * 作用：作为 AI 生成时的空间参考（Spatial Guide），强制其在对应的 8 个格子内绘图。
 */
const createGridAnchorBase64 = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576; // 16:9
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  // 绘制 4x2 弱色引导网格
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.lineWidth = 2;
  const cw = canvas.width / 4;
  const ch = canvas.height / 2;
  
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, canvas.height); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(canvas.width, ch); ctx.stroke();
  
  // 标注帧号
  ctx.font = '24px Arial';
  ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillText(`Frame ${r * 4 + c + 1}`, c * cw + 20, r * ch + 40);
    }
  }
  
  return canvas.toDataURL('image/png').split(',')[1];
};

export const generateSpriteSheet = async (
  prompt: string, 
  perspective: Perspective, 
  style: Style, 
  aspectRatio: string = "16:9", 
  usePro: boolean = false, 
  isTransparent: boolean = false,
  guideBase64?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const bgInstruction = isTransparent 
    ? "BACKGROUND: PURE TRANSPARENT ALPHA CHANNEL. NO BACKGROUND COLOR OR SHADOWS."
    : "BACKGROUND: SOLID PURE WHITE #FFFFFF.";

  const textPart = { 
    text: `Game Asset Request: High-Quality Sprite Sheet.
    SUBJECT: ${prompt}.
    LAYOUT RULES (HARD CONSTRAINT): 
    - THE OUTPUT MUST BE A 4x2 GRID (4 columns, 2 rows).
    - TOTAL FRAMES: EXACTLY 8.
    - CANVAS: 16:9 horizontal.
    - SPATIAL RULE: Follow the grid template provided. Place one character pose per cell.
    - FORBIDDEN: DO NOT generate 12 frames. DO NOT use a 4x3 grid. DO NOT use a 3x3 grid.
    PERSPECTIVE: ${perspectivePromptMap[perspective]}.
    STYLE: ${stylePromptMap[style]}.
    ${bgInstruction}
    REQUIREMENTS: Seamless animation loop. Uniform scale. No text labels on the character.`
  };

  const contents: any = { parts: [textPart] };

  // 强制注入空间引导：如果没有上传参考图，则发送 4x2 网格模版
  const spatialAnchorData = guideBase64 ? normalizeBase64(guideBase64) : createGridAnchorBase64();
  
  contents.parts.unshift({
    inlineData: { mimeType: 'image/png', data: spatialAnchorData }
  });
  
  textPart.text += `\nSPATIAL ANCHOR: Use the attached grid template as a spatial guide for positioning the 8 frames. Ensure frame 1-4 are in the top row and 5-8 are in the bottom row.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: { 
      imageConfig: { 
        aspectRatio: "16:9" as any, 
        ...(usePro ? { imageSize: "1K" } : {})
      } 
    }
  });

  const outputPart = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!outputPart?.inlineData?.data) throw new Error("API returned no image data. Try adjusting your prompt.");
  
  return `data:image/png;base64,${normalizeBase64(outputPart.inlineData.data)}`;
};

export const refineSpriteSheet = async (base64Image: string, rects: FrameRect[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const data = normalizeBase64(base64Image);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data, mimeType: 'image/png' } },
        { text: `FIX AND REFINE SPRITE SHEET:
        Current frame mapping: ${JSON.stringify(rects)}. 
        CRITICAL TASKS:
        1. FORCED LAYOUT: Re-arrange into a PERFECT 4x2 horizontal grid (8 frames).
        2. DIRECTIONAL CONSISTENCY: All characters must face the SAME direction as defined in the 'flipped' metadata.
        3. MOTION LOGIC: Ensure a smooth, logical 8-frame animation cycle.
        4. QUALITY: Sharp details, high-quality character rendering.` }
      ]
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  const refinedPart = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!refinedPart?.inlineData?.data) throw new Error("Refinement failed.");
  return `data:image/png;base64,${normalizeBase64(refinedPart.inlineData.data)}`;
};

export const chatWithAgent = async (history: ChatMessage[], message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Consultant session. History: ${JSON.stringify(history)}. Query: ${message}`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are 'NanoSprite Studio Consultant'. Helping game devs with prompts and animation research."
    }
  });
  
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web?.uri)
    .filter(Boolean);
  
  let text = response.text || "Searching...";
  if (urls && urls.length > 0) {
    text += "\n\nResources:\n" + [...new Set(urls)].map(u => `- ${u}`).join('\n');
  }
  return text;
};

export const generateVeoCinematic = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const data = normalizeBase64(base64Image);
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Dynamic animation: ${prompt}`,
    image: { imageBytes: data, mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};
