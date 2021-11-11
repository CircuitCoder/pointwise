import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

import SPEC from './test.json';
import { LayoutedTitle } from 'pointwise-render';

import * as Shaders from './shaders';

import BrandDot from './comps/BrandDot';

import ImgAboutArrow from './assets/arrow.svg';

const Render = import('pointwise-render');

type Awaited<T> = T extends PromiseLike<infer U> ? U : T

// TODO: move to rust side
export enum State {
  Anchored = 'Anchored',
  Loading = 'Loading',
  Centered = 'Centered',
};

export default function App(): JSX.Element {
  const title = useRef<LayoutedTitle>();
  const titleElem = useRef<HTMLCanvasElement>();
  const render = useRef<Awaited<typeof Render>>();

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

      const canvas: HTMLCanvasElement | null = document.getElementById('title-global') as HTMLCanvasElement | null;
      if(!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;

      const shaded = document.getElementById('title-global-shaded') as HTMLCanvasElement | null;
      if(!shaded) return;
      shaded.width = window.innerWidth;
      shaded.height = window.innerHeight;
      const prog = Shaders.setup(shaded, 20);

      const frame = () => {
        let now = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        r.render(t, ctx, now);

        Shaders.render(prog, canvas);

        requestAnimationFrame(frame);
      }

      frame();
    });
  }, []);
  const [cur, setCur] = useState(State.Anchored);
  const [titleHidden, setTitleHidden] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [shadeHidden, setShadeHidden] = useState(false);
  const [showingAbout, setShowingAbout] = useState(false);

  const trigger = () => {
    if(!title.current || !titleElem.current || !render.current) return;
    if(cur !== State.Loading) {
      const titleLoc = titleElem.current.getBoundingClientRect();
      render.current.blowup(title.current, titleLoc.x, titleLoc.y, performance.now());
      setTitleHidden(true);
      setCur(State.Loading);
    } else {
      setTimeout(() => {
        if(!title.current || !titleElem.current || !render.current) return;
        const delay = render.current.condense(title.current, performance.now());

        // TODO: do we have any better way to do this
        setTimeout(() => {
          setHidden(false);
        }, delay);
      }, 2000);
      setCur(State.Centered);
    }
  }

  return (
    <div className="app">
      <div className={clsx(
        'title-global-backdrop',
        {
          'title-global-backdrop-shown': cur === State.Loading,
        }
      )} />
      <canvas id="title-global-shaded" className={clsx({
        'title-global-shaded-shown': cur === State.Loading,
      })} onClick={trigger}></canvas>
      <canvas id="title-global" className={clsx({
        'title-global-hidden': cur === State.Anchored,
        'title-global-clipped': cur === State.Loading,
      })}></canvas>

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

        <div className={clsx("about", { 'about-shown': showingAbout })}>
          <img src={ImgAboutArrow} className="about-arrow" />
          <h2>
            关于
            <small> :: SpeicalPage</small>
          </h2>

          <p>
            <ruby>现实 <rp>(</rp><rt>Real</rt><rp>)</rp></ruby>是连续的，而人的数目<ruby>有穷 <rp>(</rp><rt>Finite</rt><rp>)</rp></ruby>。因此人类作为一个种族的认知总体在现实面前，占到的比例大概只有 0。我们终究无法达到真理。
          </p>

          <p>
            此外，无论是 256 种字节构成的任意数据，还是有限的音节和文字所构成的，从古至今的所有的文章，话语，乃至思想，都被<ruby>可数 <rp>(</rp><rt>Countable</rt><rp>)</rp></ruby>所限制。我们不仅无法想象真正的现实，甚至无法通过沟通，去了解另一个人脑中的现实，他的思想世界。
          </p>

          <p>
            我们竭尽所能做到的极致，依旧无外乎在连续的混乱中，读出带有噪声的一个<strong><span className="about-red">点</span>数据</strong>。
          </p>

          <p>
            无论如何，物理学家们还在内部对现实法则进行“无端”的猜测，并在过程中制造出了不少精巧的逻辑玩具。多数人说这些理论是困难的。少数人说它们是美丽的。还有一个<strong><span className="about-red">喵</span>喵</strong>。喵喵存在在这个混乱的现实中。
          </p>

          <p>
            这个网站也存在着，是喵喵的博客。
          </p>
        </div>

        <div className={clsx("list", { 'list-shown': !showingAbout })}>
          <div className="list-entry" onClick={trigger}>
            <div className="list-entry-date">2020-02-02</div>
            <canvas
              ref={startup}
              className={clsx("list-title", { 'list-title-hidden': titleHidden })}
            />
          </div>
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
    </div>
  );
}