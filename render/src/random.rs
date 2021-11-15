use rand_distr::Distribution;
use wasm_bindgen::prelude::*;
use rand::{SeedableRng, rngs::SmallRng};

#[wasm_bindgen]
pub struct Random {
    rng: SmallRng,
}

#[wasm_bindgen]
impl Random {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Random, JsValue> {
        console_error_panic_hook::set_once();

        let mut trng = rand::thread_rng();
        Ok(Random {
            rng: SmallRng::from_rng(&mut trng).map_err(|_| JsValue::from_str("Unable to seed rng"))?,
        })
    }

    pub fn fill_noise_f32(&mut self, buffer: &mut [f32], stddev: f32) -> Result<(), JsValue> {
        let dist = rand_distr::Normal::new(0f32, stddev).map_err(|_| JsValue::from_str("Unable to create normal distribution"))?;
        buffer.fill_with(|| {
            return dist.sample(&mut self.rng)
        });
        Ok(())
    }
}