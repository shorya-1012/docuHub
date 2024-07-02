use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DocumentRecords {
    pub title: String,
    pub description: String,
    pub document_type: String,
    pub document_size: u32,
}

#[derive(Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub description: String,
    pub document_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct DocumentInfo {
    pub id: String,
}

pub struct DocumentUser {
    pub user_id: String,
}
