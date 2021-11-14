import React, { ReactElement, useCallback, useEffect, useState } from 'react';

const DOT_FLICKER_INTERVAL = 100;
const DOT_FLICKER_MAX = 0.1;

const BrandDot = React.memo((): ReactElement => {
  const setDot = useCallback((dot: HTMLDivElement) => {
    const tick = () => {
      const delta = Math.random() * DOT_FLICKER_MAX;

      const children = dot.children;
      if(children.length >= 2) {
        const [aurora, kernel] = Array.from(children);
        aurora.animate([{}, {
          transform: `scale(${1 + delta})`,
        }], {
          duration: DOT_FLICKER_INTERVAL * 2,
          easing: 'ease',
          fill: 'both',
        });

        kernel.animate([{}, {
          transform: `scale(${1 - delta / 2})`,
        }], {
          duration: DOT_FLICKER_INTERVAL * 2,
          easing: 'ease',
          fill: 'both',
        });
      }

      setTimeout(() => {
        if(!dot.isConnected) {
          console.log('BrandDot disconnected')
        } else {
          tick();
        }
      }, DOT_FLICKER_INTERVAL);
    };

    tick();
  }, []);

  return (
    <div className="brand-dot" ref={setDot}>
      <div className="brand-dot-aurora"></div>
      <div className="brand-dot-kernel"></div>
    </div>
  );
});

export default BrandDot;