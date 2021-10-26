import { FONT_BACKEND } from './config';

export type Spec = {
  chars: CharSpec[],
  text: string,
  units_per_em: number,
};

export type CharSpec = {
  char: string,
  components: PathGroup[],
  bbox: BBox,
};

export type Path = PathCmd[];
export type PathGroup = Path[];

export type BBox = {
  left: number,
  right: number,
  top: number,
  bottom: number,
};

type Coord = [number, number];

export type PathCmd = PathCmdMove | PathCmdLine | PathCmdQuad | PathCmdCubic;
type PathCmdMove = {
  type: 'move',
  pts: Coord,
};
type PathCmdLine = {
  type: 'line',
  pts: Coord,
};
type PathCmdQuad = {
  type: 'quad',
  pts: {
    to: Coord,
    ctrl: Coord,
  }
};
type PathCmdCubic = {
  type: 'cubic',
  pts: {
    to: Coord,
    ctrl_first: Coord,
    ctrl_second: Coord,
  }
};

type PathCmdClose = {
  type: 'close',
};

type RawPathCmd = PathCmdClose | PathCmd;

type CharResp = {
  char: string,
  outline: null | RawPathCmd[],
  bbox: BBox; // TODO: maybe null
}

type Resp = {
  chars: CharResp[],
  units_per_em: number,
};

type PaintedPath = {
  path: Path,
  canvas: HTMLCanvasElement,
  children: PaintedPath[],
};

export async function fetchTextSpec(text: string): Promise<Spec> {
  const resp = await fetch(FONT_BACKEND + `/render/test?text=${text}`);
  const payload: Resp = await resp.json();

  return {
    chars: payload.chars.map(processChar),
    text,
    units_per_em: payload.units_per_em,
  }
}

function processChar(data: CharResp): CharSpec {
  // Split into basic paths
  const paths: PathCmd[][] = [];
  let current: PathCmd[] = [];

  for(const cmd of data.outline || []) {
    if(cmd.type === 'close') {
      paths.push(current);
      current = [];
    } else {
      current.push(cmd);
    }
  }

  // Paint into canvas
  const paintedPaths: PaintedPath[] = paths.map(path => ({
    path,
    canvas: paintPath(path, data.bbox),
    children: [] as PaintedPath[],
  }));

  // Compare inside or not
  const insideSet = paintedPaths.map(_ => new Set<number>());
  for(let i = 0; i < paintedPaths.length; ++i)
    for(let j = 0; j < paintedPaths.length; ++j)
      if(i !== j)
        if(isInside(paintedPaths[i], paintedPaths[j], data.bbox))
          insideSet[i].add(j);
  

  // Build hierachy
  const zeroSet: Set<number> = new Set();
  const roots: PaintedPath[] = [];
  for(let i = 0; i < paintedPaths.length; ++i)
    if(insideSet[i].size === 0) {
      zeroSet.add(i);
      roots.push(paintedPaths[i]);
    }
  
  while(zeroSet.size !== 0) {
    const curIdx: number = zeroSet.values().next().value;
    zeroSet.delete(curIdx);
    const cur = paintedPaths[curIdx];

    for(let i = 0; i < paintedPaths.length; ++i) {
      if(insideSet[i].has(curIdx)) {
        insideSet[i].delete(curIdx);
        if(insideSet[i].size === 0) {
          cur.children.push(paintedPaths[i]);
          zeroSet.add(i);
        }
      }
    }
  }

  // Compose path
  const collected = roots.flatMap(r => collectPath(r));
  return {
    char: data.char,
    components: collected,
    bbox: data.bbox,
  };
}

function paintPath(path: Path, bbox: BBox) {
  const canvas = document.createElement('canvas');
  canvas.width = bbox.right - bbox.left;
  canvas.height = bbox.bottom - bbox.top;
  const ctx = canvas.getContext('2d');
  if(!ctx) throw new Error('Unsupported canvas environment');

  ctx.fillStyle = 'black';
  ctx.beginPath();

  for(const cmd of path) {
    if(cmd.type === 'move') ctx.moveTo(cmd.pts[0] - bbox.left, cmd.pts[1] - bbox.top);
    else if(cmd.type === 'line') ctx.lineTo(cmd.pts[0] - bbox.left, cmd.pts[1] - bbox.top);
    else if(cmd.type === 'quad') ctx.quadraticCurveTo(
      cmd.pts.ctrl[0] - bbox.left, cmd.pts.ctrl[1] - bbox.top,
      cmd.pts.to[0] - bbox.left, cmd.pts.to[1] - bbox.top
    );
    else if(cmd.type === 'cubic') ctx.bezierCurveTo(
      cmd.pts.ctrl_first[0] - bbox.left, cmd.pts.ctrl_first[1] - bbox.top,
      cmd.pts.ctrl_second[0] - bbox.left, cmd.pts.ctrl_second[1] - bbox.top,
      cmd.pts.to[0] - bbox.left, cmd.pts.to[1] - bbox.top
    );
  }

  ctx.closePath();
  ctx.fill();

  return canvas;
}

function isInside(a: PaintedPath, b: PaintedPath, bbox: BBox): boolean {
  const aStart = a.path[0];
  if(aStart.type !== 'move') throw new Error(`Unsupported first command: ${JSON.stringify(aStart)}`);

  const bCtx = b.canvas.getContext('2d');
  if(!bCtx) throw new Error('Unsupported context environment');
  const imgData = bCtx.getImageData(aStart.pts[0] - bbox.left, aStart.pts[1] - bbox.top, 1, 1);
  return imgData.data[3] >= 10;
}

function collectPath(cur: PaintedPath): PathGroup[] {
  const curResult = [cur.path].concat(cur.children.map(c => c.path));
  const result = cur.children.flatMap(c => c.children.flatMap(cc => collectPath(cc)));
  result.push(curResult);
  return result;
}