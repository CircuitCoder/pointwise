import { Title as InnerTitle } from 'pointwise-render';
import React, { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { Ctx } from '../App';
import { TitleResp } from '../typings/TitleResp';
import { useRefValue } from '../utils';

type Props = {
  // TODO: statically typecheck spec
  spec: TitleResp,
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
  }, [global, spec, global?.render]); // eslint-disable-line react-hooks/exhaustive-deps

  const setup = useCallback((canvas: HTMLCanvasElement | null) => {
    if(!title || !canvas) return;

    const size = canvas.getBoundingClientRect();
    canvas.width = size.width;
    canvas.height = size.height + spec.asc / spec.em * 42 + spec.des / spec.em * 42;

    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    ctx.transform(1, 0, 0, 1, 0, spec.asc / spec.em * 42);
    let now = performance.now();
    const width = title.render(ctx, now);
    setWidth(width);

    setCanvas(canvas);
  }, [title, spec]);

  const inner = useMemo(() => {
    console.log('Update inner', title, canvas);
    if(title && canvas) return {
      title, canvas, width,
    };
    return null;
  }, [canvas, title, width]);

  useRefValue(ref, inner, [inner]);

  return (
    <canvas ref={setup} style={{
      marginTop: -spec.asc / spec.em * 42,
      marginBottom: -spec.des / spec.em * 42,
    }} className={className}></canvas>
  );
}));

export default Title;