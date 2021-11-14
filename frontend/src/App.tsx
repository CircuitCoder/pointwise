import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import SPEC from './test.json';
import { LayoutedTitle } from 'pointwise-render';

import BrandDot from './comps/BrandDot';

import React from 'react';
import TitleLayer, { TitleLayerInterface } from './comps/TitleLayer';
import ListEnt from './comps/ListEnt';
import { setup } from './shaders';
import { kickoff } from './dispatch';

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
  const [showingAbout, setShowingAbout] = useState(false);

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
                  <a onClick={() => setShowingAbout(false)}>文章</a>
                  <span className="nav-split">/</span>
                  <a>索引</a>
                  <span className="nav-split">/</span>
                  <a onClick={() => setShowingAbout(true)}>关于</a>
                </nav>
              </div>
            </div>
            <nav></nav>
          </header>


          <div className={clsx("list", { 'list-shown': !showingAbout })}>
            <ListEnt spec={SPEC} />
          </div>
        </div>

        <div className={clsx("post", { 'post-hidden': hidden })}>
          <div className="post-inner">
            <div className="post-meta">
              <div className="post-author">
                <img src="https://lh3.googleusercontent.com/a-/AOh14Gh_MGK0Bw_K_pZ2kMQ-UFnybSQbS2NSBn8m0fB7lg=s96-c" />
                <div className="post-author-img-mask" />
                <div className="post-author-info">
                  <div className="post-author-name">
                    喵喵 🍓
                  </div>
                  <div className="post-author-tool">
                    w/ 猫爪子
                  </div>
                </div>
              </div>

              <div className="post-meta-icon">
                <i className="material-icons">access_time</i>
              </div>
              <div className="post-time">
                <div className="post-time-date">
                  2020-02-02
                </div>
                <div className="post-time-time">
                  08:00:00
                </div>
                <div className="post-time-time">
                  edit @ +43d
                </div>
              </div>

              <div className="post-meta-icon">
                <i className="material-icons">style</i>
              </div>
            </div>
            <div className="post-content">
              Test
            </div>
          </div>
        </div>

      </Ctx.Provider>
    </div>
  );
}