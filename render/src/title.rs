use wasm_bindgen::prelude::*;
use pointwise_common::font::{BBox, CharResp, Outline};
use web_sys::{CanvasRenderingContext2d, window};
use crate::animation::*;
use rand::{Rng, distributions::Uniform, prelude::Distribution};

#[wasm_bindgen]
struct LayoutedComp {
    outline: Outline,

    blowup_x: CosineTiming,
    blowup_y: CosineTiming,
    blowup_prog: SineEasingTiming,
}

impl LayoutedComp {
    pub fn new(outline: Outline) -> Self {
        Self {
            outline,
            blowup_x: CosineTiming::still(0f64),
            blowup_y: CosineTiming::still(0f64),
            blowup_prog: SineEasingTiming::still(0f64),
        }
    }

    pub fn generate_blowup<R: Rng>(&mut self, rng: &mut R, now: f64, vw: f64, vh: f64) {
        let blowup_center_gen: Uniform<f64> = Uniform::from(-0.35f64..0.35f64);
        let blowup_omega_gen: Uniform<f64> = Uniform::from(
            (std::f64::consts::PI * 2f64 / 4200f64)
            ..
            (std::f64::consts::PI * 2f64 / 3800f64)
        );
        let blowup_radius_gen: Uniform<f64> = Uniform::from(20f64..200f64);
        let blowup_phase_gen: Uniform<f64> = Uniform::from(0f64..(std::f64::consts::PI * 2f64));
        const BLOWUP_DURATION: f64 = 5000f64;

        self.blowup_x.update(CosineTiming {
            omega: blowup_omega_gen.sample(rng),
            phase: blowup_phase_gen.sample(rng),
            amp: blowup_radius_gen.sample(rng),
            offset: vw * blowup_center_gen.sample(rng),
        }, now);

        self.blowup_y.update(CosineTiming {
            omega: blowup_omega_gen.sample(rng),
            phase: blowup_phase_gen.sample(rng),
            amp: blowup_radius_gen.sample(rng),
            offset: vh * blowup_center_gen.sample(rng),
        }, now);

        self.blowup_prog.update(SineEasingTiming {
            from: 0f64,
            to: 1f64,
            duration: BLOWUP_DURATION,
            delay: now,
        }, now);
    }

    pub fn render_to(&self, ctx: &web_sys::CanvasRenderingContext2d, time: f64, char_layout: &LayoutedChar) -> Result<(), JsValue> {
        // TODO: eval self x y
        ctx.save();

        let prog = self.blowup_prog.eval_at(time);
        let dx = self.blowup_x.eval_at(time) * prog;
        let dy = self.blowup_y.eval_at(time) * prog;

        ctx.transform(1f64, 0f64, 0f64, 1f64, dx / char_layout.optical_scale(), dy / char_layout.optical_scale())?;

        ctx.set_fill_style(&JsValue::from_str("black"));
        crate::font::path(&self.outline, &char_layout.bbox, ctx)?;

        ctx.fill();

        ctx.restore();

        Ok(())
    }
}

#[wasm_bindgen]
struct LayoutedChar {
    comps: Vec<LayoutedComp>,

    char: char,
    bbox: BBox,
    em: usize,

    x: f64,
    y: f64,

    size: f64,
}

impl LayoutedChar {
    pub fn render_to(&self, ctx: &web_sys::CanvasRenderingContext2d, time: f64) -> Result<(), JsValue> {
        ctx.save();

        let scale = self.optical_scale();

        ctx.set_transform(scale, 0f64, 0f64, scale, self.x, self.y)?;
        for comp in &self.comps {
            comp.render_to(ctx, time, &self)?;
        }

        ctx.restore();
        Ok(())
    }

    pub fn optical_scale(&self) -> f64 {
        self.size / (self.em as f64)
    }

    pub fn optical_width(&self) -> f64 {
        self.bbox.width() * self.optical_scale()
    }
    pub fn optical_height(&self) -> f64 {
        self.bbox.height() * self.optical_scale()
    }
}

#[wasm_bindgen]
pub struct LayoutedTitle {
    chars: Vec<LayoutedChar>,
    base_size: f64,
}

impl LayoutedTitle {
    pub fn render_to(&self, ctx: &web_sys::CanvasRenderingContext2d, time: f64) -> Result<(), JsValue> {
        for char in &self.chars {
            char.render_to(ctx, time)?;
        }
        Ok(())
    }
}

#[wasm_bindgen]
pub fn prepare(spec: &JsValue) -> Result<LayoutedTitle, JsValue> {
    // TODO: use serde-wasm-bindgen
    let spec: Vec<CharResp> = spec.into_serde().unwrap();

    let mut x = 0f64;

    let chars: Vec<_> = spec.into_iter().map(|c| -> Result<LayoutedChar, JsValue> {
        let mut comps: Vec<_> = c.components.into_iter().map(|outline| -> Result<LayoutedComp, JsValue> {
            Ok(LayoutedComp::new(outline))
            // layout.rendered.append_inner_to_elem("canvas-debug")?;
            // result.push(JsValue::from(cur))
        }).collect::<Result<_, _>>()?;

        let mut rng = rand::thread_rng();
        let vw = window().unwrap().inner_width()?.as_f64().unwrap();
        let vh = window().unwrap().inner_height()?.as_f64().unwrap();
        for comp in comps.iter_mut() {
            comp.generate_blowup(&mut rng, 0f64, vw, vh);
        }

        let c = LayoutedChar {
            comps,
            size: 54f64,

            x,
            y: 0f64,

            em: c.em,
            bbox: c.bbox,
            char: c.char,
        };

        x += c.optical_width();
        Ok(c)
    }).collect::<Result<_, _>>()?;

    let title = LayoutedTitle {
        chars,
        base_size: 54f64,
    };

    Ok(title)
}

#[wasm_bindgen]
pub fn render(spec: &LayoutedTitle, ctx: &CanvasRenderingContext2d, time: f64) -> Result<(), JsValue> {
    spec.render_to(ctx, time)
}