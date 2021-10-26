import { toEditorSettings } from 'typescript';
import { Spec, fetchTextSpec, PathGroup, BBox, CharSpec } from './font';

const STATIC_VARIATION_RATIO = 0.05;
const STATIC_SCALE_DERIV = 0.2;
const BLOWUP_RESAMPLE_INTERVAL = 100;
const BLOWUP_INIT_SPEED = 1;
const BLOWUP_DELTA_SPEED = 1e-3;
const BLOWUP_REVERSE_FACTOR = 2e-6;
const BLOWUP_DAMPING = 1e-3;

export enum State {
  Anchored = 'Anchored',
  Loading = 'Loading',
  Centered = 'Centered',
};

type CharState = {
  elem: HTMLDivElement,
  spec: CharSpec,

  comps: CompState[],

  x: number,
  y: number,
  size: number,
};

type CompState = {
  elem: HTMLDivElement,

  vx: number, // Per mills
  vy: number, // Per mills

  dx: number,
  dy: number,
}

export class Title {
  id: string;
  text: string;
  spec: Spec | null;
  elem: HTMLDivElement | null;
  chars: CharState[] | null;

  state: State;
  width: number;

  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
    this.spec = null;
    this.elem = null;
    this.chars = null;
    this.state = State.Anchored;
    this.width = 0;
  }

  async fetchSpec() {
    this.spec = await fetchTextSpec(this.text)
    this.inst();
    this.layout();
    this.animate(0);
  }

  changeState(state: State) {
    this.state = state;
    this.layout();
    this.animate();
  }

  layout() {
    if(!this.spec || !this.chars || !this.elem) return;

    // TODO: layout group

    // TODO: change based on state
    let x = 0;
    let y = 32;

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

  animate(duration: number = 1000) {
    if(!this.chars || !this.spec || !this.elem) return;

    for(const { x, y, size, elem } of this.chars) {
      elem.animate([
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

    if(this.state === State.Centered || this.state === State.Loading) {
      const { left, top } = this.elem.getBoundingClientRect();
      const vw = window.innerWidth; // TODO: change to container

      // TODO: configurable top location
      this.elem.animate([
        {
          transform: `translate(${left - vw / 2}px, ${top - 200}px)`,
        }, {
          transform: `translate(-50%, 0)`,
        }
      ], {
        duration,
        fill: 'forwards',
        easing: 'cubic-bezier(.35,0,.25,1)',
      });

      this.elem.classList.add('title-centered');
      this.elem.classList.remove('title-anchored');
    } else {
      this.elem.classList.add('title-anchored');
      this.elem.classList.remove('title-centered');
    }

    if(this.state === State.Loading) {
      this.elem.classList.add('title-loading');
      this.blowup();
    } else this.elem.classList.remove('title-loading');

    this.elem.style.width = `${this.width}px`;
  }

  blowup(dt?: number) {
    if(!this.chars) return;

    if(dt === undefined) {
      // Setup
      for(const char of this.chars)
        for(const comp of char.comps) {
          comp.dx = 0;
          comp.dy = 0;

          comp.vx = (Math.random() - 0.5) * 2 * BLOWUP_INIT_SPEED;
          comp.vy = (Math.random() - 0.5) * 2 * BLOWUP_INIT_SPEED;

          comp.elem.classList.add('title-component-floating');

          comp.elem.style.setProperty('--dx', `0px`);
          comp.elem.style.setProperty('--dy', `0px`);
        }
    } else {
      // Update
      for(const char of this.chars)
        for(const comp of char.comps) {
          comp.dx += comp.vx * dt;
          comp.dy += comp.vy * dt;
          
          const ax = (Math.random() - 0.5) * 2 * BLOWUP_DELTA_SPEED - comp.dx * BLOWUP_REVERSE_FACTOR - comp.vx * BLOWUP_DAMPING;
          const ay = (Math.random() - 0.5) * 2 * BLOWUP_DELTA_SPEED - comp.dy * BLOWUP_REVERSE_FACTOR - comp.vy * BLOWUP_DAMPING;
          comp.vx += ax * dt;
          comp.vy += ay * dt;

          comp.elem.style.setProperty('--dx', `${comp.dx}px`);
          comp.elem.style.setProperty('--dy', `${comp.dy}px`);
        }
    }

    const now = performance.now();
    setTimeout(() => {
      const ts = performance.now();
      this.blowup(ts - now);
    }, BLOWUP_RESAMPLE_INTERVAL);
  }

  inst() {
    if(this.elem) this.elem.remove();
    if(!this.spec) return;

    this.elem = document.createElement('div');
    let x = 0;
    let y = 32; // Initial height
    const upem = this.spec.units_per_em;

    this.chars = this.spec.chars.map(spec => {
      const [elem, comps] = specToChar(spec);
      return {
        elem,
        spec,
        x: 0,
        y: 0,
        size: 0,
        comps: comps.map(elem => ({
          elem,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
        })),
      };
    });

    for(const { elem } of this.chars) this.elem.appendChild(elem);

    const root = document.getElementById('title-root');
    if(root) root.appendChild(this.elem);
  }

  drop() {
    if(this.elem) this.elem.remove();
  }
}

function specToSVG(spec: PathGroup, bbox: BBox): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const height = bbox.bottom - bbox.top;
  svg.setAttribute('width', (bbox.right - bbox.left).toString());
  svg.setAttribute('height', height.toString());

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

  svg.appendChild(path);
  return svg;
}

function specToChar(spec: CharSpec): [HTMLDivElement, HTMLDivElement[]] {
  const wrapper = document.createElement('div');
  const comps = spec.components.map(comp => {
    const svg = specToSVG(comp, spec.bbox)
    const component = document.createElement('div');
    component.classList.add('title-component');
    component.appendChild(svg);
    return component;
  });

  for(const comp of comps) wrapper.appendChild(comp);

  const text = document.createElement('span');
  text.innerText = spec.char;

  wrapper.appendChild(text);

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