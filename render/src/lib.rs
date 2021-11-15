mod animation;
mod font;

pub mod title;
pub mod random;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;