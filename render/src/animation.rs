pub trait Timing {
    fn eval_at(&self, time: f64) -> f64;
    fn update(&mut self, new: Self, now: f64)
    where
        Self: Sized,
    {
        *self = new;
    }
}

pub struct CosineTiming {
    pub omega: f64,
    pub phase: f64,
    pub amp: f64,
    pub offset: f64,
}

impl CosineTiming {
    pub fn still(at: f64) -> CosineTiming {
        CosineTiming {
            offset: at,
            omega: 1f64,
            phase: 0f64,
            amp: 0f64,
        }
    }
}

impl Timing for CosineTiming {
    fn eval_at(&self, time: f64) -> f64 {
        self.amp * (time * self.omega + self.phase).cos() + self.offset
    }
}

pub struct CosineEasingTiming {
    pub from: f64,
    pub to: f64,
    pub duration: f64,
    pub delay: f64,
}

const COSINE_BEGIN_RATIO: f64 = 1f64;

impl CosineEasingTiming {
    pub fn still(at: f64) -> CosineEasingTiming {
        CosineEasingTiming {
            from: at,
            to: at,
            duration: 0f64,
            delay: 0f64,
        }
    }
}

impl Timing for CosineEasingTiming {
    fn eval_at(&self, time: f64) -> f64 {
        if time <= self.delay {
            return self.from;
        }

        if time >= self.delay + self.duration {
            return self.to;
        }

        if self.duration < 1e-6 {
            return self.to;
        }

        let begin_omega = COSINE_BEGIN_RATIO * std::f64::consts::PI;
        let begin_value = begin_omega.cos();

        let progress = (time - self.delay) / self.duration;
        let raw_interp = ((1f64 - progress) * begin_omega).cos();
        let interp = (raw_interp - begin_value) / (1f64 - begin_value);
        self.to * interp + self.from * (1f64 - interp)
    }
}

const CUBIC_BEZIER_NEWETON_EPS: f64 = 1e-4;

#[derive(Clone, Copy)]
pub struct CubicBezierFunc {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

impl CubicBezierFunc {
    fn eval(&self, at: f64) -> f64 {
        if at <= 0f64 {
            return 0f64;
        }
        if at >= 1f64 {
            return 1f64;
        }

        // Solve x -> t
        // Polynomial: x = 3(1-t)^2t x_1 + 3(1-t)t^2 x_2 + t^3
        // => x / 3 = t^3 + (t^2 - t)(t(x_1 - x_2) - x_1) = (1 + x_1 - x_2) t^3 + (- 2x_1 + x_2) t^2 + x_1 t
        // => (1 + x_1 - x_2) t^3 + (- 2x_1 + x_2) t^2 + x_1 t - x / 3 = 0

        // Derivative: 3(1 + x_1 - x_2) t^2 + 2(-1 -x_1 + x_2) t + 1 = 0

        let mut t = at;
        loop {
            let f = (1f64 + 3f64 * self.x1 - 3f64 * self.x2) * t * t * t
                + (-6f64 * self.x1 + 3f64 * self.x2) * t * t
                + 3f64 * self.x1 * t
                - at;
            let df = (1f64 + 3f64 * self.x1 - 3f64 * self.x2) * t * t * 3f64
                + (-6f64 * self.x1 + 3f64 * self.x2) * t * 2f64
                + 3f64 * self.x1;
            let dt = -f / df;
            t += dt;

            // web_sys::console::log_1(&JsValue::from_str(&format!("Current solving at: {}", t)));

            if dt.abs() < CUBIC_BEZIER_NEWETON_EPS {
                break;
            }
        }

        3f64 * (1f64 - t) * (1f64 - t) * t * self.y1
            + 3f64 * (1f64 - t) * t * t * self.y2
            + t * t * t
    }
}

pub struct CubicBezierTiming {
    pub func: CubicBezierFunc,

    pub from: f64,
    pub to: f64,
    pub duration: f64,
    pub delay: f64,
}

impl CubicBezierTiming {
    pub fn still(at: f64) -> CubicBezierTiming {
        CubicBezierTiming {
            func: CubicBezierFunc {
                x1: 0f64,
                y1: 0f64,
                x2: 0f64,
                y2: 0f64,
            },
            from: at,
            to: at,
            duration: 0f64,
            delay: 0f64,
        }
    }
}

impl Timing for CubicBezierTiming {
    fn eval_at(&self, time: f64) -> f64 {
        if time <= self.delay {
            return self.from;
        }

        if time >= self.delay + self.duration {
            return self.to;
        }

        if self.duration < 1e-6 {
            return self.to;
        }

        let progress = (time - self.delay) / self.duration;
        let interp = self.func.eval(progress);
        self.to * interp + self.from * (1f64 - interp)
    }
}
