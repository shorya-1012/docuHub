use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct PresignedUrlRespnse {
    pub presigned_url: String,
    pub document_id : String
}

#[derive(Serialize, Deserialize)]
pub struct DownloadUrl {
    pub presigned_url : String
}
