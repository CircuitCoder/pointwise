use actix_web::get;
use actix_web::web;
use actix_web::HttpResponse;
use actix_web::Responder;
use std::collections::HashMap;

use serde::Deserialize;
use serde::Serialize;
use ttf_parser::Face;
use ttf_parser::OutlineBuilder;

pub struct State {
    fonts: HashMap<String, Face<'static>>,
}

impl State {
    pub fn new(fonts: HashMap<String, Face<'static>>) -> Self {
        Self { fonts }
    }
}

#[derive(Deserialize)]
pub struct Payload {
    text: String,
}

#[derive(Serialize)]
#[serde(rename_all="lowercase")]
pub enum OutlineCmd {
    Move(f32, f32),
    Line(f32, f32),
    Quad {
        to: (f32, f32),
        ctrl: (f32, f32),
    },
    Cubic {
        to: (f32, f32),
        ctrl_first: (f32, f32),
        ctrl_second: (f32, f32),
    },
    Close,
}

#[derive(Serialize)]
pub struct CharResp {
    char: char,
    outline: Vec<OutlineCmd>,
}

#[derive(Serialize)]
pub struct QueryResp {
    chars: Vec<CharResp>,
}

impl CharResp {
    fn new(c: char) -> Self {
        Self {
            char: c,
            outline: Vec::new(),
        }
    }
}

impl OutlineBuilder for CharResp {
    fn move_to(&mut self, x: f32, y: f32) {
        self.outline.push(OutlineCmd::Move(x, y));
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.outline.push(OutlineCmd::Line(x, y));
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.outline.push(OutlineCmd::Quad {
            to: (x, y),
            ctrl: (x1, y1),
        });
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.outline.push(OutlineCmd::Cubic {
            to: (x, y),
            ctrl_first: (x1, y1),
            ctrl_second: (x2, y2),
        });
    }

    fn close(&mut self) {
        self.outline.push(OutlineCmd::Close);
    }
}

#[get("/render/{font}")]
pub async fn render(
    data: web::Data<State>,
    web::Path((font,)): web::Path<(String,)>,
    payload: web::Query<Payload>,
) -> impl Responder {
    log::debug!("Requesting font: {}", font);
    log::debug!("Text: {}", payload.text);

    let lookup = data.fonts.get(&font);
    let face = match lookup {
        None => return HttpResponse::NotFound().into(),
        Some(font) => font,
    };

    let mut resp = QueryResp { chars: Vec::new() };

    for c in payload.text.chars() {
        let glyph = match face.glyph_index(c) {
            Some(gid) => gid,
            None => {
                log::error!("Glyph \"{}\" not found in font {}.", c, font);
                continue;
            }
        };
        let mut char_resp = CharResp::new(c);
        if face.outline_glyph(glyph, &mut char_resp).is_none() {
            log::error!("Glyph \"{}\" in font {} has corrupted outline.", c, font);
            continue;
        }

        resp.chars.push(char_resp);
    }

    HttpResponse::Ok().json(resp)
}

#[get("/list")]
pub async fn list(
    data: web::Data<State>,
) -> impl Responder {
    log::debug!("Requesting list");
    HttpResponse::Ok().json(data.fonts.keys().collect::<Vec<_>>())
}
