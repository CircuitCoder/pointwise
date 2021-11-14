use crate::animation::*;
use pointwise_common::font::{BBox, CharResp, Outline};
use rand::{distributions::Uniform, prelude::Distribution, Rng};
use wasm_bindgen::prelude::*;
use web_sys::{window, CanvasRenderingContext2d};

#[wasm_bindgen]
struct LayoutedComp {
    outline: Outline,

    blowup_x: CosineTiming,
    blowup_y: CosineTiming,
    blowup_prog: CubicBezierTiming,
    floating: CubicBezierTiming,
}

const BLOWUP_DURATION: f64 = 1000f64;
const CONDENSE_DURATION: f64 = 1000f64;
const CONDENSE_INTERVAL: f64 = 200f64;
const CONDENSE_MOVE_DURATION: f64 = 2000f64;
const FONT_SIZE_LIST: f64 = 42f64;
const FONT_SIZE_TITLE: f64 = 54f64;

const CUBIC_BEZIER_EASE: CubicBezierFunc = CubicBezierFunc {
    x1: 0.25,
    y1: 0.1,
    x2: 0.25,
    y2: 1.0,
};

const CUBIC_BEZIER_BLOWUP: CubicBezierFunc = CubicBezierFunc {
    x1: 0.35,
    y1: 0.0,
    x2: 0.25,
    y2: 1.0,
};

impl LayoutedComp {
    pub fn new(outline: Outline) -> Self {
        Self {
            outline,
            blowup_x: CosineTiming::still(0f64),
            blowup_y: CosineTiming::still(0f64),
            blowup_prog: CubicBezierTiming::still(0f64),
            floating: CubicBezierTiming::still(0f64),
        }
    }

    pub fn blowup<R: Rng>(&mut self, rng: &mut R, vw: f64, vh: f64, time: f64) {
        let blowup_center_gen: Uniform<f64> = Uniform::from(-0.35f64..0.35f64);
        let blowup_omega_gen: Uniform<f64> = Uniform::from(
            (std::f64::consts::PI * 2f64 / 4200f64)..(std::f64::consts::PI * 2f64 / 3800f64),
        );
        let blowup_radius_gen: Uniform<f64> = Uniform::from(20f64..200f64);
        let blowup_phase_gen: Uniform<f64> = Uniform::from(0f64..(std::f64::consts::PI * 2f64));

        self.blowup_x.update(
            CosineTiming {
                omega: blowup_omega_gen.sample(rng),
                phase: blowup_phase_gen.sample(rng),
                amp: blowup_radius_gen.sample(rng),
                offset: vw * blowup_center_gen.sample(rng),
            },
            time,
        );

        self.blowup_y.update(
            CosineTiming {
                omega: blowup_omega_gen.sample(rng),
                phase: blowup_phase_gen.sample(rng),
                amp: blowup_radius_gen.sample(rng),
                offset: vh * blowup_center_gen.sample(rng),
            },
            time,
        );

        self.blowup_prog.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: 0f64,
                to: 1f64,
                duration: BLOWUP_DURATION,
                delay: time,
            },
            time,
        );
    }

    pub fn condense(&mut self, delay: f64, time: f64) {
        self.blowup_prog.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: 1f64,
                to: 0f64,
                duration: CONDENSE_DURATION,
                delay: time + delay,
            },
            time,
        );

        self.floating.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: 0f64,
                to: 1f64,
                duration: CONDENSE_DURATION,
                delay: time + delay,
            },
            time,
        );
    }

    pub fn render_to(
        &self,
        ctx: &web_sys::CanvasRenderingContext2d,
        time: f64,
        char_layout: &LayoutedChar,
        is_first: bool,
    ) -> Result<(), JsValue> {
        // TODO: eval self x y
        ctx.save();

        let prog = self.blowup_prog.eval_at(time);
        let dx = self.blowup_x.eval_at(time) * prog;
        let dy = self.blowup_y.eval_at(time) * prog;

        ctx.transform(
            1f64,
            0f64,
            0f64,
            1f64,
            dx / char_layout.optical_scale(time),
            dy / char_layout.optical_scale(time),
        )?;

        if is_first {
            ctx.set_fill_style(&JsValue::from_str("red"));
            ctx.set_stroke_style(&JsValue::from_str("red"));
        } else {
            ctx.set_fill_style(&JsValue::from_str("black"));
            ctx.set_stroke_style(&JsValue::from_str("black"));
        }
        ctx.set_line_width(10f64);

        let shadow = self.floating.eval_at(time);
        ctx.set_shadow_offset_y(4f64 * shadow);
        ctx.set_shadow_blur(12f64 * shadow);
        ctx.set_shadow_color("rgba(0,0,0,.6)");

        crate::font::path(&self.outline, &char_layout.bbox, ctx)?;

        ctx.set_global_alpha((1f64 - prog) * 0.9 + 0.1);
        ctx.fill();

        ctx.set_global_alpha(prog);
        ctx.stroke();

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

    dx: CubicBezierTiming,
    dy: CubicBezierTiming,

    size: CubicBezierTiming,
}

impl LayoutedChar {
    pub fn blowup<R: Rng>(&mut self, rng: &mut R, vw: f64, vh: f64, time: f64) {
        for comp in self.comps.iter_mut() {
            comp.blowup(rng, vw, vh, time);
        }

        // Dy variation = Maximum height variation
        let blowup_size_gen: Uniform<f64> = Uniform::from((FONT_SIZE_TITLE * 0.9)..(FONT_SIZE_TITLE * 1.1));
        let blowup_transform_gen: Uniform<f64> = Uniform::from(-3.0..3.0);

        self.size.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: self.size.eval_at(time), // TODO: change to eval within update
                to: blowup_size_gen.sample(rng),
                duration: BLOWUP_DURATION,
                delay: time,
            },
            time,
        );

        self.dx.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: self.dx.eval_at(time), // TODO: change to eval within update
                to: blowup_transform_gen.sample(rng),
                duration: BLOWUP_DURATION,
                delay: time,
            },
            time,
        );

        self.dy.update(
            CubicBezierTiming {
                func: CUBIC_BEZIER_BLOWUP,
                from: self.dy.eval_at(time), // TODO: change to eval within update
                to: blowup_transform_gen.sample(rng)
                    - self.optical_height(time + BLOWUP_DURATION) / 2f64,
                duration: BLOWUP_DURATION,
                delay: time,
            },
            time,
        );
    }

    pub fn condense(&mut self, delay: f64, time: f64) {
        for comp in self.comps.iter_mut() {
            comp.condense(delay, time);
        }
    }

    pub fn render_to(
        &self,
        ctx: &web_sys::CanvasRenderingContext2d,
        time: f64,
        is_first: bool,
    ) -> Result<(), JsValue> {
        ctx.save();

        let scale = self.optical_scale(time);
        let x = self.dx.eval_at(time);
        let y = self.dy.eval_at(time);

        ctx.transform(scale, 0f64, 0f64, scale, x, y)?;
        for (idx, comp) in self.comps.iter().enumerate() {
            comp.render_to(ctx, time, &self, is_first && idx == 0)?;
        }

        ctx.restore();
        Ok(())
    }

    pub fn optical_scale(&self, time: f64) -> f64 {
        self.size.eval_at(time) / (self.em as f64)
    }

    pub fn optical_width(&self, time: f64) -> f64 {
        self.bbox.width() * self.optical_scale(time)
    }

    pub fn optical_height(&self, time: f64) -> f64 {
        self.bbox.height() * self.optical_scale(time)
    }
}

#[wasm_bindgen]
pub struct LayoutedTitle {
    chars: Vec<LayoutedChar>,
    base_size: f64,

    dx: CubicBezierTiming,
    dy: CubicBezierTiming,
}

impl LayoutedTitle {
    pub fn blowup<R: Rng>(&mut self, rng: &mut R, fx: f64, fy: f64, vw: f64, vh: f64, time: f64) {
        let mut total_width = 0f64;
        for char in &mut self.chars {
            char.blowup(rng, vw, vh, time);

            total_width += char.optical_width(time + BLOWUP_DURATION);
        }

        let new_x = vw / 2f64 - total_width / 2f64;
        let new_y = vh / 2f64;

        self.dx = CubicBezierTiming {
            func: CUBIC_BEZIER_BLOWUP,
            from: fx,
            to: new_x,
            delay: time,
            duration: BLOWUP_DURATION,
        };

        self.dy = CubicBezierTiming {
            func: CUBIC_BEZIER_BLOWUP,
            from: fy,
            to: new_y,
            delay: time,
            duration: BLOWUP_DURATION,
        };
    }

    pub fn condense(&mut self, time: f64) -> f64 {
        for (idx, char) in self.chars.iter_mut().enumerate() {
            char.condense((idx as f64) * CONDENSE_INTERVAL, time);
        }

        let delay = self.chars.len() as f64 * CONDENSE_INTERVAL;

        self.dy = CubicBezierTiming {
            func: CUBIC_BEZIER_EASE,
            from: self.dy.eval_at(time + delay),
            to: 200f64,
            delay: time + delay,
            duration: CONDENSE_MOVE_DURATION,
        };

        delay
    }

    pub fn render_to(
        &self,
        ctx: &web_sys::CanvasRenderingContext2d,
        time: f64,
    ) -> Result<(), JsValue> {
        ctx.save();
        ctx.transform(
            1f64,
            0f64,
            0f64,
            1f64,
            self.dx.eval_at(time),
            self.dy.eval_at(time),
        )?;
        for (idx, char) in self.chars.iter().enumerate() {
            char.render_to(ctx, time, idx == 0)?;
            ctx.transform(1f64, 0f64, 0f64, 1f64, char.optical_width(time), 0f64)?;
        }
        ctx.restore();
        Ok(())
    }
}

#[wasm_bindgen]
pub fn prepare(spec: &JsValue) -> Result<LayoutedTitle, JsValue> {
    // TODO: use serde-wasm-bindgen
    let spec: Vec<CharResp> = spec.into_serde().map_err(|_e| JsValue::from_str("Unable to parse input."))?;

    let chars: Vec<_> = spec
        .into_iter()
        .map(|c| -> Result<LayoutedChar, JsValue> {
            let comps: Vec<_> = c
                .components
                .into_iter()
                .map(|outline| -> Result<LayoutedComp, JsValue> {
                    Ok(LayoutedComp::new(outline))
                    // layout.rendered.append_inner_to_elem("canvas-debug")?;
                    // result.push(JsValue::from(cur))
                })
                .collect::<Result<_, _>>()?;

            let c = LayoutedChar {
                comps,
                size: CubicBezierTiming::still(FONT_SIZE_LIST),

                dx: CubicBezierTiming::still(0f64),
                dy: CubicBezierTiming::still(0f64),

                em: c.em,
                bbox: c.bbox,
                char: c.char,
            };

            Ok(c)
        })
        .collect::<Result<_, _>>()?;

    let title = LayoutedTitle {
        chars,

        base_size: FONT_SIZE_LIST, // TODO: update me
        dx: CubicBezierTiming::still(0f64),
        dy: CubicBezierTiming::still(0f64),
    };

    Ok(title)
}

#[wasm_bindgen]
pub fn render(
    spec: &LayoutedTitle,
    ctx: &CanvasRenderingContext2d,
    time: f64,
) -> Result<(), JsValue> {
    spec.render_to(ctx, time)
}

#[wasm_bindgen]
pub fn blowup(title: &mut LayoutedTitle, fx: f64, fy: f64, time: f64) -> Result<(), JsValue> {
    let mut rng = rand::thread_rng();
    let vw = window().unwrap().inner_width()?.as_f64().unwrap();
    let vh = window().unwrap().inner_height()?.as_f64().unwrap();

    title.blowup(&mut rng, fx, fy, vw, vh, time);

    Ok(())
}

#[wasm_bindgen]
pub fn condense(title: &mut LayoutedTitle, time: f64) -> Result<f64, JsValue> {
    Ok(title.condense(time))
}