use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use crate::util::get_data_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub run_in_background: bool,
}


impl AppSettings {
    pub fn load(app: &AppHandle, default_run_in_background: bool) -> Self {
        let data_dir = get_data_dir(app, "pake-messenger".to_string());
        let settings_path = data_dir.join("settings.json");

        if settings_path.exists() {
            if let Ok(content) = fs::read_to_string(&settings_path) {
                if let Ok(settings) = serde_json::from_str(&content) {
                    return settings;
                }
            }
        }

        Self {
            run_in_background: default_run_in_background,
        }
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), std::io::Error> {
        let data_dir = get_data_dir(app, "pake-messenger".to_string());
        let settings_path = data_dir.join("settings.json");
        let content = serde_json::to_string_pretty(self)?;
        fs::write(settings_path, content)
    }
}
