use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ErrorJson {
    pub error : String
}
