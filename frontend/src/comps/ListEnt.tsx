import clsx from "clsx";
import React, { ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ctx } from "../App";
import Title, { TitleInner } from "./Title";

import { TitleResp } from '../typings/TitleResp';

type Props = {
  // TODO: statically typecheck spec
  spec: TitleResp,
}

const ListEnt = React.memo(({ spec }: Props): ReactElement => {
  const inner = useRef<TitleInner | null>(null);
  const [barWidth, setBarWidth] = useState(0);
  const [hidden, setHidden] = useState(false);

  const global = useContext(Ctx);
  const trigger = useCallback(() => {
    console.log('trigger', inner.current);
    if(!inner.current) return;

    const loc = inner.current.canvas.getBoundingClientRect();
    loc.y += spec.asc / spec.em * 42;

    global?.titleLayer?.blowup(inner.current.title, loc);
    setHidden(true);
  }, [global?.titleLayer, spec]);

  const updateInner = useCallback((inst: TitleInner | null) => {
    inner.current = inst;
    setBarWidth(inst?.width ?? 0);
  }, []);

  const navigate = useNavigate();
  useEffect(() => {
    if(hidden) navigate('/post/test');
  }, [hidden, navigate]);

  return (
    <div className="list-entry" onClick={trigger}>
      <div className="list-entry-date">2020-02-02</div>
      <Title spec={spec} ref={updateInner} className={clsx({ 'list-entry-canvas-hidden': hidden })} />
      <div className="list-entry-bar" style={{
        width: `${barWidth}px`,
      }}></div>
    </div>
  )
});

export default ListEnt;