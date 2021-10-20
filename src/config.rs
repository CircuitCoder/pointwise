use std::{collections::HashMap, path::PathBuf};

use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub fonts: HashMap<String, PathBuf>,
    pub bind: Url,
}
