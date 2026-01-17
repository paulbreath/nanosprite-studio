
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Perspective, Style, SpriteSheetData, Language, TRANSLATIONS, FrameRect, ChatMessage } from './types';
import { 
  generateSpriteSheet, 
  generateVeoCinematic,
  chatWithAgent,
  refineSpriteSheet
} from './services/geminiService';
import SpritePreview from './components/SpritePreview';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window { aistudio?: AIStudio; }
}

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [tab, setTab] = useState<'forge' | 'lab' | 'agent' | 'cinema'>('forge');
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isAistudioReady, setIsAistudioReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // Forge State
  const [prompt, setPrompt] = useState('德古拉吸血鬼，像素风格，披风飘动');
  const [style, setStyle] = useState<Style>(Style.PIXEL_ART_32BIT);
  const [perspective, setPerspective] = useState<Perspective>(Perspective.SIDE);
  const [usePro, setUsePro] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  
  // Data State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<SpriteSheetData | null>(null);
  
  // Lab Fine-tuning State
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [fps, setFps] = useState(12);
  const [previewScale, setPreviewScale] = useState(1.2); 
  const [showGuides, setShowGuides] = useState(true);
  const [showOnionSkin, setShowOnionSkin] = useState(false);
  const [showAnchorLine, setShowAnchorLine] = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const [showHitbox, setShowHitbox] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const forgeRefInputRef = useRef<HTMLInputElement>(null);

  // Agent State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Cinema State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang];

  const defaultRects: FrameRect[] = Array(8).fill(null).map((_, i) => ({
    x: (i % 4) * 25, 
    y: Math.floor(i / 4) * 50, 
    w: 25, 
    h: 50,
    flipped: false
  }));

  const checkKeyStatus = useCallback(async () => {
    if (window.aistudio) {
      setIsAistudioReady(true);
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
        return hasKey;
      } catch (e) {
        console.error("API status check error:", e);
      }
    } else {
      setIsAistudioReady(false);
    }
    return false;
  }, []);

  useEffect(() => {
    checkKeyStatus();
    const interval = setInterval(checkKeyStatus, 2000);
    window.addEventListener('focus', checkKeyStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkKeyStatus);
    };
  }, [checkKeyStatus]);

  const handleOpenKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setIsKeySelected(true);
      } catch (e) {
        console.error("Failed to open key selector:", e);
      }
    } else {
      alert("环境初始化中或当前平台不支持 API 密钥管理接口。");
    }
  };

  const onForge = async () => {
    if (usePro && !isKeySelected) {
      const confirmBind = window.confirm("使用 Gemini 3.0 Pro 引擎需要绑定您个人的 Paid API Key。现在去绑定吗？");
      if (confirmBind) handleOpenKey();
      return;
    }

    setLoading(true);
    setLoadingMsg(`正在使用 ${usePro ? 'Gemini 3.0 Pro' : 'Gemini 2.5 Flash'} 进行图集锻造...`);
    try {
      const imageUrl = await generateSpriteSheet(
        prompt, 
        perspective, 
        style, 
        "16:9", 
        usePro, 
        isTransparent, 
        referenceImage || undefined
      );
      const newData: SpriteSheetData = {
        imageUrl,
        prompt,
        perspective,
        style,
        timestamp: Date.now(),
        customRects: defaultRects
      };
      setActiveSheet(newData);
      setTab('lab');
    } catch (e: any) {
      if (e.message.includes("not found") || e.message.includes("401") || e.message.includes("key")) {
        setIsKeySelected(false);
        alert("您的个人 API 密钥无效或未配置计费。请绑定已启用 Paid 计费的项目密钥。");
        handleOpenKey();
      } else {
        alert(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefine = async () => {
    if (!activeSheet) return;
    if (!isKeySelected) { handleOpenKey(); return; }
    setLoading(true);
    setLoadingMsg("AI 正在使用 3.0 Pro 引擎扫描并重画图集...");
    try {
      const refinedUrl = await refineSpriteSheet(activeSheet.imageUrl, activeSheet.customRects || defaultRects);
      setActiveSheet({ ...activeSheet, imageUrl: refinedUrl });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onGenerateVideo = async () => {
    if (!activeSheet) return;
    if (!isKeySelected) { handleOpenKey(); return; }
    setLoading(true);
    setLoadingMsg("正在调用 VEO 3.1 电影引擎，请稍候...");
    try {
      const url = await generateVeoCinematic(activeSheet.imageUrl, activeSheet.prompt);
      setVideoUrl(url);
      setTab('cinema');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateActiveFrameRect = (updates: Partial<FrameRect>) => {
    if (!activeSheet) return;
    const newRects = [...(activeSheet.customRects || defaultRects)];
    newRects[activeFrameIndex] = { ...newRects[activeFrameIndex], ...updates };
    setActiveSheet({ ...activeSheet, customRects: newRects });
  };

  const toggleFlipAtIndex = (index: number) => {
    if (!activeSheet) return;
    const newRects = [...(activeSheet.customRects || defaultRects)];
    newRects[index] = { ...newRects[index], flipped: !newRects[index].flipped };
    setActiveSheet({ ...activeSheet, customRects: newRects });
  };

  const onSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory([...chatHistory, userMsg]);
    setChatInput('');
    try {
      const response = await chatWithAgent([...chatHistory, userMsg], chatInput);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }]);
    }
  };

  const activeRect = (activeSheet?.customRects || defaultRects)[activeFrameIndex];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">{t.title}</h1>
              <p className="text-[10px] font-bold text-indigo-400/80 tracking-[0.2em] uppercase">Horizontal 4x2 Edition</p>
            </div>
          </div>
          <nav className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/5">
            {(['forge', 'lab', 'agent', 'cinema'] as const).map((id) => (
              <button key={id} onClick={() => setTab(id)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {t.tabs[id]}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/5 transition-colors">
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <div className="flex flex-col items-end">
              <button 
                onClick={handleOpenKey} 
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md group ${isKeySelected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/30 ring-2 ring-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <div className={`w-2 h-2 rounded-full ${isKeySelected ? 'bg-emerald-400' : 'bg-white animate-pulse'}`} />
                {!isAistudioReady && !isKeySelected ? '正在初始化接口...' : isKeySelected ? '个人 Pro 密钥已授权' : '使用个人密钥解锁 3.0 Pro'}
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[9px] text-slate-500 hover:text-indigo-400 mt-1 transition-colors flex items-center gap-1 font-bold">
                前往申请计费密钥 (AI Studio) ↗
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white mb-2">处理中...</h2>
              <p className="text-slate-400 font-medium">{loadingMsg}</p>
            </div>
          </div>
        )}

        {tab === 'forge' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.promptLabel}</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-indigo-500/40 outline-none min-h-[120px]" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">参考图 (可选)</label>
                    <div className="flex flex-col gap-3">
                      <input type="file" accept="image/*" className="hidden" ref={forgeRefInputRef} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setReferenceImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                      {!referenceImage ? (
                        <button onClick={() => forgeRefInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-slate-400 group">
                          <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">点击上传参考图像</span>
                        </button>
                      ) : (
                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                          <img src={referenceImage} className="w-full h-full object-contain" alt="Reference" />
                          <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      {t.modelLabel}
                      {usePro && !isKeySelected && <button onClick={handleOpenKey} className="ml-2 text-amber-500 text-[10px] font-black underline hover:text-amber-400 animate-pulse">需绑定个人 KEY</button>}
                    </label>
                    <select value={usePro ? 'pro' : 'flash'} onChange={(e) => setUsePro(e.target.value === 'pro')} className={`w-full bg-black/40 border rounded-xl p-3 text-xs font-bold outline-none ring-offset-0 focus:ring-2 ring-indigo-500/50 ${usePro ? 'border-indigo-500/50 text-indigo-300' : 'border-white/10 text-slate-300'}`}>
                      <option value="flash">{t.models.flash}</option>
                      <option value="pro">{t.models.pro}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.styleLabel}</label>
                      <select value={style} onChange={(e) => setStyle(e.target.value as Style)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none">
                        {Object.values(Style).map(s => <option key={s} value={s}>{t.styles[s]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.perspectiveLabel}</label>
                      <select value={perspective} onChange={(e) => setPerspective(e.target.value as Perspective)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none">
                        {Object.values(Perspective).map(p => <option key={p} value={p}>{t.perspectives[p]}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={onForge} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                    {t.generateBtn}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                {!activeSheet ? (
                  <div className="text-center space-y-6 max-w-sm relative z-10">
                    <div className="relative mx-auto mb-6 w-48 aspect-video bg-indigo-500/5 rounded-2xl border border-indigo-500/20 overflow-hidden">
                       <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-1 p-2 opacity-30">
                          {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className="border border-indigo-500/40 rounded flex items-center justify-center text-[8px] font-black text-indigo-400 uppercase">F{i+1}</div>
                          ))}
                       </div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl">📐</span>
                       </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white mb-2 tracking-tight">已强制 4x2 空间引导</h2>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed">工作站将自动向模型注入 4x2 空间坐标层。建议绑定您自己的 API Key 以开启 3.0 Pro 的高精度绘图能力。</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center gap-10">
                    <div className="w-full aspect-video bg-black/20 rounded-2xl border border-white/10 flex items-center justify-center p-4">
                      <img src={activeSheet.imageUrl} className="max-w-full max-h-full object-contain rounded shadow-2xl" alt="Result" />
                    </div>
                    <button onClick={() => setTab('lab')} className="px-12 py-3 bg-indigo-500 text-white rounded-xl font-black text-sm shadow-xl hover:bg-indigo-600 transition-colors">进入精修工作站</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'lab' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* 左侧预览区 */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {!activeSheet ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center min-h-[450px]">
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center mx-auto"><span className="text-5xl">📤</span></div>
                    <h2 className="text-2xl font-black text-white mb-2">准备精修</h2>
                    <p className="text-slate-400 text-sm">请先锻造或导入一个精灵图集</p>
                  </div>
                </div>
              ) : (
                <>
                  <SpritePreview 
                    imageUrl={activeSheet.imageUrl} 
                    frameCount={8} 
                    fps={fps} 
                    scale={previewScale} 
                    imageAspectRatio={1.777} 
                    customRects={activeSheet.customRects || defaultRects} 
                    showGuides={showGuides} 
                    showOnionSkin={showOnionSkin} 
                    showAnchorLine={showAnchorLine} 
                    showOutline={showOutline}
                    showHitbox={showHitbox}
                    className="w-full" 
                  />
                  
                  <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.masterSheet} (4x2 Grid)</h3>
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/20 uppercase tracking-tighter">Current: Frame {activeFrameIndex + 1}</span>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-2 gap-3 aspect-video w-full bg-black/20 p-3 rounded-2xl border border-white/10">
                      {(activeSheet.customRects || defaultRects).map((rect, i) => (
                        <div 
                          key={i} 
                          onClick={() => setActiveFrameIndex(i)} 
                          className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer bg-slate-800/50 group ${activeFrameIndex === i ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-white/5 hover:border-white/20'}`}
                        >
                          <div className="w-full h-full" style={{ backgroundImage: `url(${activeSheet.imageUrl})`, backgroundSize: `${(100/rect.w)*100}% ${(100/rect.h)*100}%`, backgroundPosition: `${rect.w === 100 ? 0 : (rect.x / (100 - rect.w)) * 100}% ${rect.h === 100 ? 0 : (rect.y / (100 - rect.h)) * 100}%`, transform: rect.flipped ? 'scaleX(-1)' : 'none', imageRendering: 'pixelated' }} />
                          <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-black text-white/50">{i+1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 右侧控制区 */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6 sticky top-28 shadow-2xl overflow-y-auto no-scrollbar max-h-[calc(100vh-140px)]">
                {/* 全局控制 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest pb-2 border-b border-white/5">{t.tuning.global}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>FPS: {fps}</span>
                      <span>Speed</span>
                    </div>
                    <input type="range" min="1" max="60" value={fps} onChange={(e) => setFps(parseInt(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Zoom: {previewScale.toFixed(1)}x</span>
                      <span>Scale</span>
                    </div>
                    <input type="range" min="0.5" max="3" step="0.1" value={previewScale} onChange={(e) => setPreviewScale(parseFloat(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[
                      { label: t.tuning.onionSkin, state: showOnionSkin, set: setShowOnionSkin },
                      { label: t.tuning.guides, state: showGuides, set: setShowGuides },
                      { label: t.tuning.anchor, state: showAnchorLine, set: setShowAnchorLine },
                      { label: t.outlineToggle, state: showOutline, set: setShowOutline },
                      { label: t.hitboxToggle, state: showHitbox, set: setShowHitbox }
                    ].map((item, i) => (
                      <button key={i} onClick={() => item.set(!item.state)} className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${item.state ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 单帧控制 */}
                {activeSheet && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-fuchsia-400 uppercase tracking-widest pb-2 border-b border-white/5">{t.tuning.perFrame.replace('{n}', (activeFrameIndex + 1).toString())}</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>{t.tuning.posX}: {activeRect.x}%</span>
                        </div>
                        <input type="range" min="0" max="75" value={activeRect.x} onChange={(e) => updateActiveFrameRect({ x: parseInt(e.target.value) })} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>{t.tuning.posY}: {activeRect.y}%</span>
                        </div>
                        <input type="range" min="0" max="50" value={activeRect.y} onChange={(e) => updateActiveFrameRect({ y: parseInt(e.target.value) })} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>{t.tuning.width}: {activeRect.w}%</span>
                        </div>
                        <input type="range" min="5" max="25" value={activeRect.w} onChange={(e) => updateActiveFrameRect({ w: parseInt(e.target.value) })} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>{t.tuning.height}: {activeRect.h}%</span>
                        </div>
                        <input type="range" min="10" max="50" value={activeRect.h} onChange={(e) => updateActiveFrameRect({ h: parseInt(e.target.value) })} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                      </div>
                    </div>

                    <button onClick={() => toggleFlipAtIndex(activeFrameIndex)} className={`w-full py-3 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-2 ${activeRect.flipped ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300' : 'bg-black/20 border-white/5 text-slate-500'}`}>
                      <span>⇄</span> {t.flipLabel}
                    </button>
                  </div>
                )}

                {/* 导入/操作按钮 */}
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setActiveSheet({ imageUrl: base64, prompt: "Imported", perspective: Perspective.SIDE, style: Style.PIXEL_ART_32BIT, timestamp: Date.now(), customRects: defaultRects });
                      }
                      reader.readAsDataURL(file);
                    }
                  }} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-black text-slate-300 text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all uppercase">{t.uploadBtn} 📁</button>
                  
                  {activeSheet && (
                    <>
                      <button onClick={onRefine} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-lg uppercase shadow-indigo-600/20">{t.refineBtn}</button>
                      <button onClick={onGenerateVideo} className="w-full py-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl font-black text-fuchsia-400 text-[10px] tracking-widest hover:bg-fuchsia-500/20 transition-all uppercase">{t.veoBtn}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'agent' && (
          <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-slate-900/50 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-black/20">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                  <div className="text-6xl">🤖</div>
                  <p className="text-sm font-black uppercase tracking-widest">NanoSprite AI 顾问在线</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/80 border border-white/10 text-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-900 border-t border-white/5 flex gap-4">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSendMessage()} placeholder={t.agentPlaceholder} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 ring-indigo-500/50 transition-all" />
              <button onClick={onSendMessage} className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">发送</button>
            </div>
          </div>
        )}

        {tab === 'cinema' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            <div className="aspect-video bg-black rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center relative group">
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-5xl opacity-20">🎬</div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">暂无电影预览，请在精修工作站中渲染</p>
                </div>
              )}
              <div className="absolute top-6 left-6 px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">VEO 3.1 Cinematic Preview</div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">由 Gemini 3.0 & VEO 3.1 驱动 • Nano 精灵工坊 Horizontal 4x2 Edition</p>
      </footer>
    </div>
  );
};

export default App;
