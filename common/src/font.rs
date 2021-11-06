use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all="lowercase")]
pub enum OutlineCmd {
    Move(f64, f64),
    Line(f64, f64),
    Quad {
        to: (f64, f64),
        ctrl: (f64, f64),
    },
    Cubic {
        to: (f64, f64),
        ctrl_first: (f64, f64),
        ctrl_second: (f64, f64),
    },
    Close,
}

impl OutlineCmd {
    pub fn within_bbox(&self, bbox: &BBox) -> OutlineCmd {
        match self {
            OutlineCmd::Move(x, y) => OutlineCmd::Move(x - bbox.left, y - bbox.top),
            OutlineCmd::Line(x, y) => OutlineCmd::Line(x - bbox.left, y - bbox.top),
            OutlineCmd::Quad { to: (tx, ty), ctrl: (cx, cy) } =>
                OutlineCmd::Quad {
                    to: (tx - bbox.left, ty - bbox.top),
                    ctrl: (cx - bbox.left, cy - bbox.top),
                },
            OutlineCmd::Cubic {
                to: (tx, ty),
                ctrl_first: (c1x, c1y),
                ctrl_second: (c2x, c2y),
            } =>
                OutlineCmd::Cubic{
                    to: (tx - bbox.left, ty - bbox.top),
                    ctrl_first: (c1x - bbox.left, c1y - bbox.top),
                    ctrl_second: (c2x - bbox.left, c2y - bbox.top),
                },
            OutlineCmd::Close => OutlineCmd::Close,
        }
    }
}

pub type Outline = Vec<OutlineCmd>;

#[derive(Serialize, Deserialize)]
pub struct BBox {
    pub top: f64,
    pub bottom: f64,
    pub left: f64,
    pub right: f64,
}

#[derive(Serialize, Deserialize)]
pub struct CharResp {
    pub char: char,
    pub components: Vec<Outline>,
    pub bbox: BBox,
    pub em: usize,
}
