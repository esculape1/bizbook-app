'use client';

import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';

export function ResponsiveA4Wrapper({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number | undefined>(undefined);

  const updateDimensions = useCallback(() => {
    if (containerRef.current && innerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // Largeur A4 standard en pixels à 96 DPI (approx 210mm)
      const a4Width = 794; 
      const newScale = Math.min(1, containerWidth / a4Width);
      setScale(newScale);
      
      // On calcule la hauteur proportionnelle pour éviter les espaces vides ou les coupures
      setInnerHeight(innerRef.current.scrollHeight * newScale);
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    const ro = new ResizeObserver(updateDimensions);
    if (containerRef.current) ro.observe(containerRef.current);
    
    const mo = new MutationObserver(updateDimensions);
    if (innerRef.current) {
      mo.observe(innerRef.current, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
    }
    
    const t = setTimeout(updateDimensions, 500);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      ro.disconnect();
      mo.disconnect();
      clearTimeout(t);
    };
  }, [updateDimensions]);

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden transition-all duration-300"
      style={{ height: innerHeight ? `${innerHeight}px` : 'auto' }}
    >
      <div 
        ref={innerRef} 
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: scale < 1 ? `${100 / scale}%` : '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
