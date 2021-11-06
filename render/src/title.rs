use wasm_bindgen::prelude::*;
use pointwise_common::font::CharResp;

#[wasm_bindgen]
pub fn prepare(spec: &JsValue) -> Result<Vec<JsValue>, JsValue> {
    // TODO: use serde-wasm-bindgen
    let spec: Vec<CharResp> = spec.into_serde().unwrap();
    let mut result: Vec<JsValue> = Vec::new();

    for c in spec.iter() {
        for comp in c.components.iter() {
            let cur = crate::font::render_comp(comp, &c.bbox, "black")?;
            cur.append_inner_to_elem("canvas-debug")?;
            result.push(JsValue::from(cur))
        }
    }

    Ok(result.into())
}