use crate::schemas::document_records::{Document, DocumentInfo};
use crate::schemas::error_json::ErrorJson;
use crate::schemas::presigned_url_schema::{DownloadUrl, PresignedUrlRespnse};
use crate::utils::auth_helper::get_jwt_claim;
use crate::{schemas::document_records::DocumentRecords, AppState};
use actix_web::{
    delete, dev::ServiceRequest, get, post, web, HttpRequest, HttpResponse, Responder,
};
use aws_sdk_s3::presigning::PresigningConfig;
use dotenv::dotenv;
use sqlx::Row;
use std::time::Duration;
use uuid::Uuid;

#[get("/get-all-documents")]
async fn get_all_documents(req: HttpRequest, app_state: web::Data<AppState>) -> impl Responder {
    let service_req = ServiceRequest::from_request(req);
    let claim = get_jwt_claim(&service_req, &app_state.client).await;
    if claim.is_none() {
        let error_message = ErrorJson {
            error: "User is not authorized to access this endpoint".to_string(),
        };
        return HttpResponse::Unauthorized().json(error_message);
    }

    let user_id = claim.unwrap().sub;

    let command = format!(
        "SELECT id , title , description , type FROM user_documents WHERE userid ='{}'",
        user_id
    );

    let rows = match sqlx::query(&command).fetch_all(&app_state.db_pool).await {
        Ok(val) => val,
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::NotFound().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    let documents: Vec<Document> = rows
        .iter()
        .map(|row| Document {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            document_type: row.get("type"),
        })
        .collect();

    HttpResponse::Ok().json(documents)
}

#[post("/get-signed-url")]
pub async fn generate_signed_url(
    req: HttpRequest,
    document_data: web::Json<DocumentRecords>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    dotenv().ok();

    let service_req = ServiceRequest::from_request(req);
    let claim = get_jwt_claim(&service_req, &app_state.client).await;
    if claim.is_none() {
        let error_message = ErrorJson {
            error: "User is not authorized to access this endpoint".to_string(),
        };
        return HttpResponse::Unauthorized().json(error_message);
    }

    let user_id = claim.unwrap().sub;

    let max_allowed_size = 1024 * 1024 * 10;
    if document_data.document_size > max_allowed_size {
        return HttpResponse::PayloadTooLarge().json(ErrorJson {
            error: "Provided file is too large".to_string(),
        });
    }

    // create record in db
    let query = "INSERT INTO user_documents VALUES ($1 , $2 , $3, $4 , $5)";
    let document_id = generate_document_id();
    let document_extension: Vec<&str> = document_data.document_type.split("/").collect();

    match sqlx::query(query)
        .bind(&document_id)
        .bind(&document_data.title)
        .bind(&document_extension[1])
        .bind(&document_data.description)
        .bind(&user_id)
        .execute(&app_state.db_pool)
        .await
    {
        Ok(_) => println!("Created"),
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::InternalServerError().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    // create signedURL
    let bucket_name = std::env::var("AWS_BUCKET_NAME").expect("AWS BUCKET NAME NOT PROVIDED");
    let expires_in = Duration::from_secs(60);
    let presigned_config = PresigningConfig::builder()
        .expires_in(expires_in)
        .build()
        .unwrap();
    let key = format!("{}/{}", user_id, document_id);

    let presigned_request = match app_state
        .s3_client
        .put_object()
        .bucket(bucket_name)
        .key(key)
        .content_type(&document_data.document_type)
        .content_length(document_data.document_size as i64)
        .presigned(presigned_config)
        .await
    {
        Ok(presigend_url) => presigend_url,
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::InternalServerError().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    let response = PresignedUrlRespnse {
        presigned_url: presigned_request.uri().to_string(),
        document_id,
    };

    HttpResponse::Created().json(response)
}

fn generate_document_id() -> String {
    let id = Uuid::new_v4();
    id.to_string()
}

#[get("/get-download-url")]
pub async fn get_download_url(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    document_info: web::Query<DocumentInfo>,
) -> impl Responder {
    dotenv().ok();

    let service_req = ServiceRequest::from_request(req);
    let claim = get_jwt_claim(&service_req, &app_state.client).await;
    if claim.is_none() {
        let error_message = ErrorJson {
            error: "User is not authorized to access this endpoint".to_string(),
        };
        return HttpResponse::Unauthorized().json(error_message);
    }

    let user_id = claim.unwrap().sub;

    let command = format!(
        "SELECT userid FROM user_documents WHERE id ='{}'",
        document_info.id
    );

    let row = match sqlx::query(&command).fetch_one(&app_state.db_pool).await {
        Ok(val) => val,
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::NotFound().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    let document_owner_id: String = row.get("userid");

    if document_owner_id != user_id {
        return HttpResponse::Forbidden().json(ErrorJson {
            error: "User id does not match, you are not authorized to delete this file".to_string(),
        });
    }

    let document_id = &document_info.id;
    if document_id == "" {
        return HttpResponse::BadRequest().json(ErrorJson {
            error: "Document Id not provided".to_string(),
        });
    }

    let bucket_name = std::env::var("AWS_BUCKET_NAME").expect("AWS BUCKET NAME NOT PROVIDED");
    let key = format!("{}/{}", user_id, document_id);
    let expires_in = Duration::from_secs(60);

    let presigned_config = PresigningConfig::builder()
        .expires_in(expires_in)
        .build()
        .unwrap();

    let presigned_url = match app_state
        .s3_client
        .get_object()
        .bucket(bucket_name)
        .key(key)
        .presigned(presigned_config)
        .await
    {
        Ok(url) => url,
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::InternalServerError().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    let response = DownloadUrl {
        presigned_url: presigned_url.uri().to_string(),
    };

    HttpResponse::Created().json(response)
}

#[delete("delete-db-record")]
pub async fn delete_record(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    document_info: web::Query<DocumentInfo>,
) -> impl Responder {
    let service_req = ServiceRequest::from_request(req);
    let claim = get_jwt_claim(&service_req, &app_state.client).await;
    if claim.is_none() {
        let error_message = ErrorJson {
            error: "User is not authorized to access this endpoint".to_string(),
        };
        return HttpResponse::Unauthorized().json(error_message);
    }

    let user_id = claim.unwrap().sub;

    let command = format!(
        "SELECT userid FROM user_documents WHERE id ='{}'",
        document_info.id
    );

    let row = match sqlx::query(&command).fetch_one(&app_state.db_pool).await {
        Ok(val) => val,
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::NotFound().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    let document_owner_id: String = row.get("userid");

    if document_owner_id != user_id {
        return HttpResponse::Forbidden().json(ErrorJson {
            error: "User id does not match, you are not authorized to delete this file".to_string(),
        });
    }

    let delete_command = format!("DELETE FROM user_documents WHERE id='{}'", document_info.id);
    match sqlx::query(&delete_command)
        .execute(&app_state.db_pool)
        .await
    {
        Ok(_) => println!("Deleted"),
        Err(err) => {
            println!("{:#?}", err);
            return HttpResponse::InternalServerError().json(ErrorJson {
                error: err.to_string(),
            });
        }
    };

    HttpResponse::Ok().json("Object deleted")
}
