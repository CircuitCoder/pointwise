import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { State, Title } from './title';

import SPEC from './test.json';

const Render = import('pointwise-render');

export default function App(): JSX.Element {
  const title = useRef<Title>();
  const titleRef = useRef<SVGUseElement>(null);

  const startup = useCallback((elem: SVGSVGElement) => {
    Render.then(r => {
      let title = r.prepare(SPEC)
      const canvas: HTMLCanvasElement = document.getElementById('canvas-debug') as HTMLCanvasElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;

      const frame = () => {
        let now = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        r.render(title, ctx, now);

        requestAnimationFrame(frame);
      }

      frame();
    });
  }, []);
  const [cur, setCur] = useState(State.Anchored);
  const [titleHidden, setTitleHidden] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <div className="app" onClick={() => {
      console.log('Trigger');
      if(cur !== State.Loading) {
        title.current?.changeState(State.Loading, titleRef.current).then(() => {
          setTitleHidden(true);
        });
        setCur(State.Loading);
      } else {
        title.current?.changeState(State.Centered, titleRef.current).then(() => {
          setHidden(false);
        });;
        setCur(State.Centered);
      }
    }}>
      <svg ref={startup} className="list-title">
        {(!titleHidden) && (
          <use href="#title-def-test" ref={titleRef} />
        )}
      </svg>
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