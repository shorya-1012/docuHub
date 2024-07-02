use actix_web::{get, HttpResponse, Responder};

#[get("/healthcheck")]
pub async fn check() -> impl Responder {
    HttpResponse::Ok().body("server is running")
}
