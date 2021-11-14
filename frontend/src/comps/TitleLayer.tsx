import { condense, LayoutedTitle } from 'pointwise-render';
import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { register, unregister } from '../dispatch';

import * as Shaders from '../shaders';
import { Ctx, GlobalCtx } from '../App';
const Render = import('pointwise-render');

export type TitleLayerInterface = {
  blowup: (title: LayoutedTitle, cur: DOMRect) => void,
  condense: () => Promise<void>,
}

enum State {
  Idle = 'IDLE',
  Blownup = 'BLOWNUP',
  Condensed = 'CONDENSED',
}

type Props = {
  exp: (int: TitleLayerInterface) => void ,
}

const TitleLayer = React.memo(({ exp }: Props): ReactElement => {
  const [state, setState] = useState(State.Idle);
  const titleRef = useRef<LayoutedTitle | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>();
  const shadedRef = useRef<HTMLCanvasElement>();
  const progRef = useRef<Shaders.Program>();
  const global = useContext(Ctx);

  const int: TitleLayerInterface = useMemo(() => {
    return {
      blowup(title: LayoutedTitle, cur: DOMRect) {
        setState(s => {
          if(s !== State.Idle) return s;
          global?.render.blowup(title, cur.x, cur.y, performance.now());
          titleRef.current = title;
          return State.Blownup;
        });
      },

      condense(): Promise<void> {
        let delay = 0;
        setState(s => {
          if(s !== State.Blownup) return s;
          if(titleRef.current)
            delay = global?.render.condense(titleRef.current, performance.now()) ?? 0;
          return State.Blownup;
        });
        return new Promise(resolve => setTimeout(resolve, delay));
      }
    };
  }, [global?.render]);


  useEffect(() => {
    exp(int);
  }, [exp]);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvasRef.current = canvas;
  }, []);

  const setupShaded = useCallback((shaded: HTMLCanvasElement) => {
    shaded.width = window.innerWidth;
    shaded.height = window.innerHeight;
    progRef.current = Shaders.setup(shaded, 20);

    shadedRef.current = shaded;
  }, []);

  useEffect(() => {
    if(!global) throw new Error('GlobalCtx not yet initialized');
    const tick = (ts: DOMHighResTimeStamp) => {
      if(!shadedRef.current || !canvasRef.current || !progRef.current) return;
      if(!titleRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if(!ctx) throw new Error('Cannot get context 2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      global.render.render(titleRef.current, ctx, ts);

      Shaders.render(progRef.current, canvasRef.current);
    };

    register('title-layer-animation', tick);
    return () => {
      unregister('title-layer-animation', tick);
    };
  }, []);

  return <>
    <div className={clsx(
      'title-global-backdrop',
      {
        'title-global-backdrop-shown': state === State.Blownup,
      }
    )} />
    <canvas id="title-global-shaded" ref={setupShaded} className={clsx({
      'title-global-shaded-shown': state === State.Blownup,
    })}></canvas>
    <canvas id="title-global" ref={setupCanvas} className={clsx({
      'title-global-hidden': state === State.Condensed,
      'title-global-clipped': state === State.Blownup,
    })}></canvas>
  </>;
});

export default TitleLayer;