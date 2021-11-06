use pointwise_common::font::{BBox, Outline, OutlineCmd};
use wasm_bindgen::{JsCast, prelude::*};
use web_sys::{Document, HtmlCanvasElement};

pub fn render(
    spec: &Outline,
    bbox: &BBox,
    stroke_style: &str,
    fill_style: &str,
) -> Result<HtmlCanvasElement, JsValue> {
    let doc = web_sys::window().unwrap().document().unwrap();
    let canvas = doc.create_element("canvas")?;
    let canvas = canvas.dyn_into::<HtmlCanvasElement>()?;
    let ctx = canvas.get_context("2d")?.unwrap().dyn_into::<web_sys::CanvasRenderingContext2d>()?;

    ctx.set_stroke_style(&JsValue::from_str(stroke_style));
    ctx.set_fill_style(&JsValue::from_str(fill_style));
    ctx.begin_path();
    for cmd in spec.iter() {
        match cmd.within_bbox(bbox) {
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

    ctx.stroke();
    ctx.fill();

    Ok(canvas)
}

#[wasm_bindgen]
pub struct RenderedComp {
    stroke: HtmlCanvasElement,
    inner: HtmlCanvasElement,
}

pub fn render_comp(spec: &Outline, bbox: &BBox, style: &str) -> Result<RenderedComp, JsValue> {
    let stroke = render(spec, bbox, style, "transparent")?;
    let inner = render(spec, bbox, "transparent", style)?;
    Ok(RenderedComp { stroke, inner })
}

impl RenderedComp {
    pub fn append_inner_to_elem(&self, id: &str) -> Result<(), JsValue> {
        let doc = web_sys::window().unwrap().document().unwrap();
        let parent = doc.get_element_by_id(id).unwrap();

        parent.append_child(&self.inner)?;

        Ok(())
    }
}