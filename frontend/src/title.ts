import { toEditorSettings } from 'typescript';
import { Spec, fetchTextSpec, PathGroup, BBox, CharSpec } from './font';

const STATIC_VARIATION_RATIO = 0.05;
const STATIC_SCALE_DERIV = 0.2;
const BLOWUP_MEAN_RADIUS = 100;
const BLOWUP_MEAN_PERIOD = 2000;
const BLOWUP_PERIOD_DERIV = 200;
const BLOWUP_RANGE_RATIO = 0.7;
const SETTLE_INTERVAL = 200;

export enum State {
  Anchored = 'Anchored',
  Loading = 'Loading',
  Centered = 'Centered',
};

type CharState = {
  def: SVGGElement,
  spec: CharSpec,

  comps: CompState[],

  x: number,
  y: number,
  size: number,
};

type CompState = {
  def: SVGGElement,
}

export class Title {
  id: string;
  text: string;
  spec: Spec | null;
  def: SVGGElement | null;
  chars: CharState[] | null;

  global: SVGUseElement;

  state: State;
  width: number;

  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
    this.spec = null;
    this.def = null;
    this.chars = null;
    this.state = State.Anchored;
    this.width = 0;

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#title-def-${this.id}`);
    this.global = use;

    const root = document.getElementById('title-global');
    if(root) root.append(use);
  }

  async fetchSpec() {
    this.spec = await fetchTextSpec(this.text)
    this.inst();
    this.layout();
    this.animate(this.global, 0);
  }

  changeState(state: State, external?: SVGUseElement | null): Promise<void> {
    const base = (this.state === State.Loading ? this.global : external) ?? this.global;
    this.state = state;
    this.layout();
    return this.animate(base);
  }

  layout() {
    if(!this.spec || !this.chars || !this.def) return;

    let x = 0;
    let y = this.state === State.Anchored ? 32 : 0;

    // Layout chars
    for(const char of this.chars) {
      let scale = 1;
      let vertVariation = 0;
      let hozVariation = 0;

      if(this.state !== State.Anchored) {
        scale = genScaleRatio();
        vertVariation = genTransformRatio();
        hozVariation = genTransformRatio();
      }

      const spec = char.spec;

      const bbw = spec.bbox.right - spec.bbox.left;
      const bbh = spec.bbox.bottom - spec.bbox.top;
      const cw = scale * 54 * bbw / this.spec.units_per_em;
      const ch = scale * 54 * bbh / this.spec.units_per_em;
      const cx = x + hozVariation * cw;
      const cy = y + vertVariation * ch - ch / 2; // TODO: baseline

      char.x = cx;
      char.y = cy;
      // TODO: change font size
      char.size = 54 * scale;

      x += cw;
    };

    this.width = x;
  }

  animate(base: SVGUseElement, duration: number = 1000): Promise<void> {
    if(!this.chars || !this.spec || !this.def || !this.global) return Promise.reject();

    // Display state
    this.global.style.display = this.state === State.Anchored ? 'none' : 'inline-block';

    for(const { x, y, size, def } of this.chars) {
      def.animate([
        {},
        {
          '--optical-scale': size / this.spec.units_per_em,
          '--x': `${x}px`,
          '--y': `${y}px`,
        },
      ], {
        duration,
        fill: 'forwards',
        easing: 'cubic-bezier(.35,0,.25,1)',
      });
    }

    if(this.state === State.Loading) {
      // TODO: anchored?
      const { left, top } = base.getBoundingClientRect();
      const vw = window.innerWidth; // TODO: change to container
      const vh = window.innerHeight; // TODO: change to container

      // TODO: configurable top location
      this.def.animate([
        {
          transform: `translate(${left - vw / 2}px, ${top - vh / 2}px)`,
        }, {
          transform: `translate(-${this.width/2}px, 0)`,
        }
      ], {
        duration,
        fill: 'forwards',
        easing: 'cubic-bezier(.35,0,.25,1)',
      });

      this.global.classList.add('title-centered');
      this.global.classList.remove('title-anchored');
    } else if(this.state === State.Anchored) {
      this.global.classList.add('title-anchored');
      this.global.classList.remove('title-centered');
    }

    let ret: Promise<void>;
    if(this.state === State.Loading) {
      this.def.classList.add('title-loading');
      for(const { def } of this.chars) def.classList.add('title-char-loading');
      ret = this.blowup();
    } else if(this.state === State.Centered) {
      ret = this.settle();
    } else {
      ret = Promise.resolve();
    }

    this.def.style.width = `${this.width}px`;
    return ret;
  }

  blowup(): Promise<void> {
    if(!this.chars) return Promise.reject();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    for(const { comps, def } of this.chars) {
      for(const comp of comps) {
        const cx = vw * (Math.random() - 0.5) * BLOWUP_RANGE_RATIO;
        const cy = vh * (Math.random() - 0.5) * BLOWUP_RANGE_RATIO;

        const rx = BLOWUP_MEAN_RADIUS * Math.random() * 2;
        const ry = BLOWUP_MEAN_RADIUS * Math.random() * 2;

        const tx = BLOWUP_MEAN_PERIOD + (Math.random() - 0.5) * 2 * BLOWUP_PERIOD_DERIV;
        const ty = BLOWUP_MEAN_PERIOD + (Math.random() - 0.5) * 2 * BLOWUP_PERIOD_DERIV;

        const anix = comp.def.animate([
          { '--dx': `${cx + rx}px` },
          { '--dx': `${cx - rx}px` },
        ], {
          duration: tx,
          delay: -tx * Math.random(),
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out',
        });

        const aniy = comp.def.animate([
          { '--dy': `${cy + ry}px` },
          { '--dy': `${cy - ry}px` },
        ], {
          duration: ty,
          delay: -ty * Math.random(),
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out',
        });
      }

      def.animate([
        {},
        { '--deriv': '1' },
      ], {
        duration: 1000,
        fill: 'forwards',
        easing: 'cubic-bezier(.35,0,.25,1)',
      });
    }

    return Promise.resolve();
  }

  settle(): Promise<void> {
    if(!this.def || !this.chars) return Promise.reject();
    this.def.classList.remove('title-loading');

    this.chars.forEach(({ def }, idx) => {
      setTimeout(() => {
        def.classList.remove('title-char-loading');
        def.animate([
          {},
          { '--deriv': '0' },
        ], {
          duration: 1000,
          fill: 'forwards',
          easing: 'cubic-bezier(.35,0,.25,1)',
        });
      }, idx * SETTLE_INTERVAL);
    });
    // TODO: drop all animations, or we can do this when starting the new animation?

    const delay = this.chars.length * SETTLE_INTERVAL;
    return new Promise(resolve => {
      setTimeout(() => {
        this.global.animate([
          {},
          { transform: 'translateY(calc(200px - 50vh))' },
        ], {
          duration: 2000,
          easing: 'ease',
          fill: 'both',
        });

        resolve();
      }, delay);
    });
  }

  inst() {
    if(this.def) this.def.remove();
    if(!this.spec) return;

    this.def = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let x = 0;
    let y = 32; // Initial height
    const upem = this.spec.units_per_em;

    this.chars = this.spec.chars.map(spec => {
      const [def, comps] = specToChar(spec);
      return {
        def,
        spec,
        x: 0,
        y: 0,
        size: 0,
        comps: comps.map(def => ({
          def,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
        })),
      };
    });

    for(const { def } of this.chars) this.def.appendChild(def);
    this.def.id = `title-def-${this.id}`;

    const defs = document.getElementById('title-defs');
    if(defs) defs.appendChild(this.def);
  }

  drop() {
    if(this.def) this.def.remove();
  }
}

function specToSVG(spec: PathGroup, bbox: BBox): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const height = bbox.bottom - bbox.top;
  g.setAttribute('width', (bbox.right - bbox.left).toString());
  g.setAttribute('height', height.toString());

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  let d = '';
  for(const path of spec) {
    for(const cmd of path) {
      if(cmd.type === 'move') d += `M ${cmd.pts[0] - bbox.left} ${height - cmd.pts[1] + bbox.top}\n`;
      if(cmd.type === 'line') d += `L ${cmd.pts[0] - bbox.left} ${height - cmd.pts[1] + bbox.top}\n`;
      if(cmd.type === 'quad') d += `
        Q ${cmd.pts.ctrl[0] - bbox.left} ${height - cmd.pts.ctrl[1] + bbox.top}
          ${cmd.pts.to[0] - bbox.left} ${height - cmd.pts.to[1] + bbox.top}
      `;
      if(cmd.type === 'cubic') d += `
        C ${cmd.pts.ctrl_first[0] - bbox.left} ${height - cmd.pts.ctrl_first[1] + bbox.top}
          ${cmd.pts.ctrl_second[0] - bbox.left} ${height - cmd.pts.ctrl_second[1] + bbox.top}
          ${cmd.pts.to[0] - bbox.left} ${height - cmd.pts.to[1] + bbox.top}
      `;
    }
    d += 'Z';
  }

  path.setAttribute('d', d);

  g.appendChild(path);
  return g;
}

function specToChar(spec: CharSpec): [SVGGElement, SVGGElement[]] {
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const comps = spec.components.map(comp => {
    const path = specToSVG(comp, spec.bbox)
    const component = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    component.classList.add('title-component');
    component.appendChild(path);
    return component;
  });

  for(const comp of comps) wrapper.appendChild(comp);

  // const text = document.createElement('span');
  // text.innerText = spec.char;

  // wrapper.appendChild(text);

  wrapper.classList.add('title-char');

  return [wrapper, comps];
}

function genScaleRatio(): number {
  const limit = STATIC_SCALE_DERIV;
  const rand = Math.random() * 2 - 1;
  return 1 + limit * rand;
}

function genTransformRatio(): number {
  const limit = STATIC_VARIATION_RATIO;
  const rand = Math.random() * 2 - 1;
  return limit * rand;
}