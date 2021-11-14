import React, { ReactElement, useCallback, useContext, useRef, useState } from "react";
import { Ctx } from "../App";
import Title, { TitleInner } from "./Title";

type Props = {
  // TODO: statically typecheck spec
  spec: any,
}

const ListEnt = React.memo(({ spec }: Props): ReactElement => {
  const inner = useRef<TitleInner>(null);
  const [hidden, setHidden] = useState(false);

  const global = useContext(Ctx);
  const trigger = useCallback(() => {
    console.log('trigger', inner.current);
    if(!inner.current) return;

    const loc = inner.current.canvas.getBoundingClientRect();
    global?.titleLayer?.blowup(inner.current.title, loc);
    setHidden(true);
  }, [global?.titleLayer]);

  return (
    <div className="list-entry" onClick={trigger}>
      <div className="list-entry-date">2020-02-02</div>
      {!hidden && (
        <Title spec={spec} ref={inner} />
      )}
    </div>
  )
});

export default ListEnt;