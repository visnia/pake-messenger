use std::sync::Mutex;
use crate::app::settings::AppSettings;

pub struct AppState {
    pub settings: Mutex<AppSettings>,
}
