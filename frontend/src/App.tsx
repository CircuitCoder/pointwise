import { useEffect, useRef, useState } from 'react';

import React from 'react';
import TitleLayer, { TitleLayerInterface } from './comps/TitleLayer';
import { kickoff } from './dispatch';
import Base from './pages/base';
import Header from './comps/Header';

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
  const [render, setRender] = useState<Awaited<typeof Render> | null>(null);

  useEffect(() => {
    Render.then(setRender);
    kickoff();
  }, []);

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
          <Header />
          <Base />
        </div>
      </Ctx.Provider>
    </div>
  );
}