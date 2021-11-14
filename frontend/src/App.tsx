import { useEffect, useRef, useState } from 'react';
import { LayoutedTitle } from 'pointwise-render';
import Route, { NavLink } from 'react-router-dom';

import BrandDot from './comps/BrandDot';

import React from 'react';
import TitleLayer, { TitleLayerInterface } from './comps/TitleLayer';
import { kickoff } from './dispatch';
import Base from './pages/base';

const Render = import('pointwise-render');

type Awaited<T> = T extends PromiseLike<infer U> ? U : T

// TODO: move to rust side
export enum State {
  Anchored = 'Anchored',
  Loading = 'Loading',
  Centered = 'Centered',
};

export type GlobalCtx = {
  titleLayer: TitleLayerInterface | null,
  render: Awaited<typeof Render>;
}
export const Ctx = React.createContext<GlobalCtx | null>(null);

export default function App(): JSX.Element {
  const title = useRef<LayoutedTitle>();
  const titleElem = useRef<HTMLCanvasElement>();
  const [render, setRender] = useState<Awaited<typeof Render> | null>(null);

  /*
  const startup = useCallback((local: HTMLCanvasElement) => {
    Render.then(r => {
      render.current = r;

      // TODO: move into comp
      const t = r.prepare(SPEC);
      title.current = t;
      titleElem.current = local;

      const localSize = local.getBoundingClientRect();
      local.width = localSize.width;
      local.height = localSize.height;

      const localCtx = local.getContext('2d');
      if(!localCtx) return;
      let now = performance.now();
      r.render(t, localCtx, now);
    });
  }, []);
  */
 useEffect(() => {
   Render.then(setRender);
   kickoff();
 }, []);

  const [hidden, setHidden] = useState(true);

  const [titleLayer, setTitleLayer] = useState<TitleLayerInterface | null>(null);

  if(!render) return <div />
  const ctxInst: GlobalCtx = {
    render,
    titleLayer,
  }

  return (
    <div className="app">
      <Ctx.Provider value={ctxInst}>
        <TitleLayer exp={setTitleLayer} />

        <div className="column">
          <header>
            <div className="brand">
              <BrandDot />
              <div className="brand-text">
                <h1 className="brand-text-main">
                  点测量
                  <small>
                    &nbsp;:: BlogOf&lt;Meow&gt;
                  </small>
                </h1>

                <nav>
                  <NavLink to="/">文章</NavLink>
                  <span className="nav-split">/</span>
                  <a>索引</a>
                  <span className="nav-split">/</span>
                  <NavLink to="/about">关于</NavLink>
                </nav>
              </div>
            </div>
            <nav></nav>
          </header>

          <Base />
        </div>
      </Ctx.Provider>
    </div>
  );
}