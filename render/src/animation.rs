pub trait Timing {
    fn eval_at(&self, time: f64) -> f64;
    fn update(&mut self, new: Self, now: f64) where Self: Sized {
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

pub struct SineEasingTiming {
    pub from: f64,
    pub to: f64,
    pub duration: f64,
    pub delay: f64,
}

const SINE_BEGIN_RATIO: f64 = 0.1;

impl SineEasingTiming {
    pub fn still(at: f64) -> SineEasingTiming {
        SineEasingTiming {
            from: at,
            to: at,
            duration: 0f64,
            delay: 0f64,
        }
    }
}

impl Timing for SineEasingTiming {
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

        let begin_ratio: f64 = (SINE_BEGIN_RATIO * std::f64::consts::FRAC_PI_2).sin();

        let progress = (time - self.delay) / self.duration;
        let raw_interp = ((progress * (1f64 - SINE_BEGIN_RATIO) + SINE_BEGIN_RATIO) * (std::f64::consts::FRAC_PI_2)).sin();
        let interp = (raw_interp - begin_ratio) / (1f64 - begin_ratio);
        self.to * interp + self.from * (1f64 - interp)
    }
}