trait Timing {
    fn eval_at(&self, time: f64) -> f64;
}

struct CosineTiming {
    omega: f64,
    phase: f64,
    amp: f64,
}

impl Timing for CosineTiming {
    fn eval_at(&self, time: f64) -> f64 {
        self.amp * (time * self.omega + self.phase).cos()
    }
}