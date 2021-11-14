import { LayoutedTitle } from 'pointwise-render';
import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ctx } from '../App';
import { useRefValue } from '../utils';

const Render = import('pointwise-render');

type Props = {
  // TODO: statically typecheck spec
  spec: any,
}

export type TitleInner = {
  title: LayoutedTitle,
  canvas: HTMLCanvasElement,
}

const Title = React.memo(React.forwardRef<TitleInner, Props>(({ spec }, ref): ReactElement => {
  const global = useContext(Ctx);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  // TODO: figure out a way to handle WASM free

  const title = useMemo(() => {
    return global?.render.prepare(spec);
  }, [spec, global?.render]);

  const setup = useCallback((canvas: HTMLCanvasElement | null) => {
    if(!title || !global?.render || !canvas) return;

    const size = canvas.getBoundingClientRect();
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    let now = performance.now();
    global.render.render(title, ctx, now);

    setCanvas(canvas);
  }, [title, global?.render]);

  const inner = useMemo(() => {
    console.log('Update inner', title, canvas);
    if(title && canvas) return {
      title, canvas,
    };
    return null;
  }, [canvas, title]);

  useRefValue(ref, inner, [inner]);

  return (
    <canvas ref={setup}></canvas>
  );
}));

export default Title;