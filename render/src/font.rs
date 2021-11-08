use pointwise_common::font::{BBox, Outline, OutlineCmd};
use wasm_bindgen::{JsCast, prelude::*};
use web_sys::{CanvasRenderingContext2d, Document, HtmlCanvasElement};

pub fn path(
    spec: &Outline,
    bbox: &BBox,
    ctx: &CanvasRenderingContext2d,
) -> Result<(), JsValue> {
    ctx.begin_path();
    for cmd in spec.iter() {
        match cmd.draw_within_bbox(bbox) {
            OutlineCmd::Move(x, y) => ctx.move_to(x, y),
            OutlineCmd::Line(x, y) => ctx.line_to(x, y),
            OutlineCmd::Quad { to, ctrl } => ctx.quadratic_curve_to(ctrl.0, ctrl.1, to.0, to.1),
            OutlineCmd::Cubic { to, ctrl_first, ctrl_second } => ctx.bezier_curve_to(
                ctrl_first.0, ctrl_first.1,
                ctrl_second.0, ctrl_second.1,
                to.0, to.1,
            ),
            OutlineCmd::Close => ctx.close_path(),
        }
    }
    Ok(())
}