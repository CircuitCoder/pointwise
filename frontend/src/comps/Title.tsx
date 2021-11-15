import { Title as InnerTitle } from 'pointwise-render';
import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ctx } from '../App';
import { useRefValue } from '../utils';

const Render = import('pointwise-render');

type Props = {
  // TODO: statically typecheck spec
  spec: any,
  className?: string,
}

export type TitleInner = {
  title: InnerTitle,
  canvas: HTMLCanvasElement,
  width: number,
}

const Title = React.memo(React.forwardRef<TitleInner, Props>(({ spec, className }, ref): ReactElement => {
  const global = useContext(Ctx);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [width, setWidth] = useState(0);

  // TODO: figure out a way to handle WASM free

  const title = useMemo(() => {
    if(!global) return null;
    return new global.render.Title(spec);
  }, [spec, global?.render]);

  const setup = useCallback((canvas: HTMLCanvasElement | null) => {
    if(!title || !canvas) return;

    const size = canvas.getBoundingClientRect();
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    let now = performance.now();
    const width = title.render(ctx, now);
    setWidth(width);

    setCanvas(canvas);
  }, [title]);

  const inner = useMemo(() => {
    console.log('Update inner', title, canvas);
    if(title && canvas) return {
      title, canvas, width,
    };
    return null;
  }, [canvas, title, width]);

  useRefValue(ref, inner, [inner]);

  return (
    <canvas ref={setup} className={className}></canvas>
  );
}));

export default Title;