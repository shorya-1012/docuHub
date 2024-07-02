use actix_web::dev::ServiceRequest;
use clerk_rs::{
    clerk::Clerk,
    validators::actix::{clerk_authorize, ClerkJwt},
};

pub async fn get_jwt_claim(
    service_request: &ServiceRequest,
    clerk_client: &Clerk,
) -> Option<ClerkJwt> {
    match clerk_authorize(service_request, clerk_client, true).await {
        Ok(val) => Some(val.1),
        Err(_) => None,
    }
}
