import { Title } from 'pointwise-render';
import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { register, unregister } from '../dispatch';

import * as Shaders from '../shaders';
import { Ctx } from '../App';
import { useSyncedRef } from '../utils';

export type TitleLayerInterface = {
  blowup: (title: Title, cur: DOMRect) => void,
  condense: () => Promise<void>,
}

enum StateTag {
  Idle = 'IDLE',
  Blownup = 'BLOWNUP',
  Condensed = 'CONDENSED',
}

type State = ({
  tag: StateTag.Idle,
}) | ({
  tag: StateTag.Blownup,
  title: Title,
}) | ({
  tag: StateTag.Condensed,
  title: Title,
});

const IDLE: State = {
  tag: StateTag.Idle,
};

type Props = {
  exp: (int: TitleLayerInterface) => void ,
}

const TitleLayer = React.memo(({ exp }: Props): ReactElement => {
  const [state, setState] = useState<State>(IDLE);
  const canvasRef = useRef<HTMLCanvasElement>();
  const shadedRef = useRef<HTMLCanvasElement>();
  const progRef = useRef<Shaders.Program>();
  const global = useContext(Ctx);

  const titleRaw = state.tag === StateTag.Idle ? null : state.title;
  const title = useSyncedRef(titleRaw)

  const int: TitleLayerInterface = useMemo(() => {
    return {
      blowup(title: Title, cur: DOMRect) {
        setState(s => {
          if(s.tag !== StateTag.Idle) return s;

          title.blowup(cur.x, cur.y, performance.now());
          setTimeout(() => {
            if(global && global.appRef.current)
              global.appRef.current.scrollTop = 0;
          }, 2000);
          return { tag: StateTag.Blownup, title };
        });
      },

      condense(): Promise<void> {
        let delay = 0;
        setState(s => {
          if(s.tag !== StateTag.Blownup) return s;

          delay = s.title.condense(performance.now());
          return { tag: StateTag.Condensed, title: s.title };
        });
        return new Promise(resolve => setTimeout(resolve, delay));
      }
    };
  }, []);


  useEffect(() => {
    exp(int);
  }, [exp, int]);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvasRef.current = canvas;
  }, []);

  const setupShaded = useCallback((shaded: HTMLCanvasElement) => {
    if(!global?.render) return;

    shaded.width = window.innerWidth;
    shaded.height = window.innerHeight;
    progRef.current = Shaders.setup(shaded, 20, new global.render.Random(), performance.now());

    shadedRef.current = shaded;
  }, [global?.render]);

  useEffect(() => {
    if(!global) throw new Error('GlobalCtx not yet initialized');
    const tick = (ts: DOMHighResTimeStamp) => {
      if(!shadedRef.current || !canvasRef.current || !progRef.current) return;
      if(!title.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if(!ctx) throw new Error('Cannot get context 2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      title.current.render(ctx, ts);

      Shaders.render(progRef.current, canvasRef.current, ts);
    };

    register('title-layer-animation', tick);
    return () => {
      unregister('title-layer-animation', tick);
    };
  }, [global]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <div className={clsx(
      'title-global-backdrop',
      {
        'title-global-backdrop-shown': state.tag === StateTag.Blownup,
      }
    )} />
    <canvas id="title-global-shaded" ref={setupShaded} className={clsx({
      'title-global-shaded-shown': state.tag === StateTag.Blownup,
    })}></canvas>
    <canvas id="title-global" ref={setupCanvas} className={clsx({
      'title-global-clipped': state.tag === StateTag.Blownup,
    })}></canvas>
  </>;
});

export default TitleLayer;