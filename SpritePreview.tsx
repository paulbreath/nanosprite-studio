
import React, { useState, useEffect, useRef } from 'react';
import { FrameRect } from '../types';

interface SpritePreviewProps {
  imageUrl: string;
  frameCount: number;
  fps: number;
  scale: number;
  imageAspectRatio: number;
  customRects?: FrameRect[];
  showGuides: boolean;
  showOnionSkin: boolean;
  showAnchorLine: boolean;
  showOutline?: boolean;
  showHitbox?: boolean;
  onFrameChange?: (frame: number) => void;
  className?: string;
}

const SpritePreview: React.FC<SpritePreviewProps> = ({
  imageUrl,
  frameCount = 8,
  fps = 10,
  scale = 1.0,
  imageAspectRatio = 1.0,
  customRects,
  showGuides = false,
  showOnionSkin = false,
  showAnchorLine = false,
  showOutline = false,
  showHitbox = false,
  onFrameChange,
  className = ""
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const requestRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (time - lastUpdateRef.current > 1000 / fps) {
        const nextFrame = (currentFrame + 1) % frameCount;
        setCurrentFrame(nextFrame);
        onFrameChange?.(nextFrame);
        lastUpdateRef.current = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [fps, frameCount, currentFrame, onFrameChange]);

  const basePreviewHeight = 280; 
  const displayHeight = basePreviewHeight * scale;

  const getFrameStyles = (frameIndex: number, isOnion = false) => {
    const defaultRects: FrameRect[] = Array(8).fill(null).map((_, i) => ({
      x: (i % 4) * 25, y: Math.floor(i / 4) * 50, w: 25, h: 50, flipped: false
    }));

    const rect = (customRects && customRects[frameIndex]) || defaultRects[frameIndex];
    
    const rectAR = rect.w / rect.h;
    const visualAR = rectAR * imageAspectRatio; 
    const currentWidth = displayHeight * visualAR;

    const bgScaleX = 100 / rect.w;
    const bgScaleY = 100 / rect.h;
    
    const bgPX = rect.w === 100 ? 0 : (rect.x / (100 - rect.w)) * 100;
    const bgPY = rect.h === 100 ? 0 : (rect.y / (100 - rect.h)) * 100;

    const outlineFilter = showOutline 
      ? 'drop-shadow(1px 0px 0px #6366f1) drop-shadow(-1px 0px 0px #6366f1) drop-shadow(0px 1px 0px #6366f1) drop-shadow(0px -1px 0px #6366f1)' 
      : 'none';

    // 组合翻转和居中
    const flipTransform = rect.flipped ? 'scaleX(-1)' : 'scaleX(1)';

    return {
      width: `${Math.round(currentWidth)}px`,
      height: `${Math.round(displayHeight)}px`,
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${bgScaleX * 100}% ${bgScaleY * 100}%`,
      backgroundPosition: `${bgPX}% ${bgPY}%`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated' as const,
      opacity: isOnion ? 0.2 : 1,
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      transform: `translate(-50%, -50%) ${flipTransform}`,
      filter: isOnion ? 'grayscale(1) brightness(2)' : outlineFilter,
    };
  };

  return (
    <div 
      className={`relative overflow-visible bg-slate-900/80 rounded-[40px] border border-white/10 shadow-2xl flex items-center justify-center transition-all ${className}`}
      style={{ width: '100%', minHeight: `${basePreviewHeight * 1.4}px` }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[40px] overflow-hidden" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
        {showOnionSkin && <div style={getFrameStyles((currentFrame - 1 + frameCount) % frameCount, true)} />}
        <div key={`frame-${currentFrame}`} style={getFrameStyles(currentFrame)} />
      </div>

      {showHitbox && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-red-500/50 bg-red-500/10 z-20 pointer-events-none" 
          style={{ 
            width: `${Math.round(displayHeight * (customRects?.[currentFrame]?.w || 25) / (customRects?.[currentFrame]?.h || 50) * imageAspectRatio)}px`,
            height: `${Math.round(displayHeight)}px`
          }}>
        </div>
      )}

      {showAnchorLine && (
        <>
          <div className="absolute bottom-[20%] left-0 right-0 h-[2px] bg-emerald-500/40 pointer-events-none z-10"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-indigo-500/40 border-l border-dashed border-indigo-400/20 pointer-events-none z-10"></div>
        </>
      )}
      
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none z-10 rounded-[40px] overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5"></div>
        </div>
      )}

      <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black text-indigo-400 uppercase tracking-widest z-30">
        Frame 0{currentFrame + 1}
      </div>
    </div>
  );
};

export default SpritePreview;
