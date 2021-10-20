use actix_web::Responder;
use actix_web::get;
use actix_web::web;

use serde::Deserialize;

#[derive(Deserialize)]
pub struct Payload {
  text: String,
}

#[get("/render/{font}")]
pub async fn render(web::Path((font,)): web::Path<(String,)>, payload: web::Query<Payload>) -> impl Responder {
  log::debug!("Requesting font: {}", font);
  log::debug!("Text: {}", payload.text);
  "Test"
}

#[get("/list")]
pub async fn list() -> impl Responder {
  log::debug!("Listing");
  "List"
}