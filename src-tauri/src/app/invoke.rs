use crate::util::{check_file_or_append, get_download_message_with_lang, show_toast, MessageType};
use std::fs::{self, File};
use std::io::Write;
use std::str::FromStr;
use tauri::http::Method;
use tauri::{command, AppHandle, Manager, Url, WebviewWindow};
use tauri_plugin_http::reqwest::{ClientBuilder, Request};

#[derive(serde::Deserialize)]
pub struct DownloadFileParams {
    url: String,
    filename: String,
    language: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct BinaryDownloadParams {
    filename: String,
    binary: Vec<u8>,
    language: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct NotificationParams {
    title: String,
    body: String,
    icon: String,
}

#[command]
pub async fn download_file(app: AppHandle, params: DownloadFileParams) -> Result<(), String> {
    let window: WebviewWindow = app.get_webview_window("pake").unwrap();
    show_toast(
        &window,
        &get_download_message_with_lang(MessageType::Start, params.language.clone()),
    );

    let output_path = app.path().download_dir().unwrap().join(params.filename);
    let file_path = check_file_or_append(output_path.to_str().unwrap());
    let client = ClientBuilder::new().build().unwrap();

    let response = client
        .execute(Request::new(
            Method::GET,
            Url::from_str(&params.url).unwrap(),
        ))
        .await;

    match response {
        Ok(res) => {
            let bytes = res.bytes().await.unwrap();

            let mut file = File::create(file_path).unwrap();
            file.write_all(&bytes).unwrap();
            show_toast(
                &window,
                &get_download_message_with_lang(MessageType::Success, params.language.clone()),
            );
            Ok(())
        }
        Err(e) => {
            show_toast(
                &window,
                &get_download_message_with_lang(MessageType::Failure, params.language),
            );
            Err(e.to_string())
        }
    }
}

#[command]
pub async fn download_file_by_binary(
    app: AppHandle,
    params: BinaryDownloadParams,
) -> Result<(), String> {
    let window: WebviewWindow = app.get_webview_window("pake").unwrap();
    show_toast(
        &window,
        &get_download_message_with_lang(MessageType::Start, params.language.clone()),
    );
    let output_path = app.path().download_dir().unwrap().join(params.filename);
    let file_path = check_file_or_append(output_path.to_str().unwrap());
    let download_file_result = fs::write(file_path, &params.binary);
    match download_file_result {
        Ok(_) => {
            show_toast(
                &window,
                &get_download_message_with_lang(MessageType::Success, params.language.clone()),
            );
            Ok(())
        }
        Err(e) => {
            show_toast(
                &window,
                &get_download_message_with_lang(MessageType::Failure, params.language),
            );
            Err(e.to_string())
        }
    }
}

#[command]
pub fn send_notification(app: AppHandle, params: NotificationParams) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&params.title)
        .body(&params.body)
        .icon(&params.icon)
        .show()
        .unwrap();
    Ok(())
}

#[command]
pub fn update_badge(_app: AppHandle, count: i32) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::AppHandleExt;
        let _ = _app.set_app_icon_badge_count(Some(count));
    }

    #[cfg(target_os = "windows")]
    {
        use tauri::Manager;
        use windows::Win32::UI::Shell::{ITaskbarList3, TaskbarList};
        use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_INPROC_SERVER, CoInitialize};
        use windows::Win32::UI::WindowsAndMessaging::{CreateIcon, DestroyIcon, HICON};
        use windows::Win32::Foundation::HWND;

        // Helper to create a red dot icon
        unsafe fn create_red_dot_icon() -> Result<HICON, String> {
            let width = 16;
            let height = 16;
            
            // AND mask (1 bit per pixel). 1 = transparent, 0 = opaque.
            // 16 pixels per row = 16 bits = 2 bytes per row.
            // 16 rows * 2 bytes = 32 bytes.
            // Initialize as all transparent (0xFF) then we'll make the circle opaque.
            let mut and_mask = vec![0xFFu8; 32];
            
            // XOR mask (32 bits per pixel - BGRA). 
            // 16 * 16 * 4 = 1024 bytes.
            let mut xor_mask = vec![0u8; 1024];

            let center_x = 7.5f32;
            let center_y = 7.5f32;
            let radius = 4.0f32; // Reduced from 7.0
            let radius_sq = radius * radius;

            for y in 0..height {
                for x in 0..width {
                    let dx = (x as f32) - center_x;
                    let dy = (y as f32) - center_y;
                    let dist_sq = dx*dx + dy*dy;

                    if dist_sq <= radius_sq {
                        // Inside circle: Opaque in AND mask (0), Red in XOR mask
                        
                        // Set AND mask bit to 0
                        let byte_idx = (y * 2) + (x / 8);
                        let bit_idx = 7 - (x % 8);
                        and_mask[byte_idx as usize] &= !(1 << bit_idx);

                        // Set XOR mask pixel to Red (BGRA: 0, 0, 255, 255)
                        let pixel_idx = ((y * width + x) * 4) as usize;
                        xor_mask[pixel_idx] = 0;     // B
                        xor_mask[pixel_idx + 1] = 0; // G
                        xor_mask[pixel_idx + 2] = 255; // R
                        xor_mask[pixel_idx + 3] = 255; // A
                    }
                }
            }

            let icon = CreateIcon(
                None,
                width as i32,
                height as i32,
                1,
                32,
                and_mask.as_ptr(),
                xor_mask.as_ptr(),
            ).map_err(|e| e.to_string())?;

            if icon.is_invalid() {
                Err("Failed to create icon".to_string())
            } else {
                Ok(icon)
            }
        }

        if let Some(window) = _app.get_webview_window("pake") {
            if let Ok(hwnd) = window.hwnd() {
                unsafe {
                    let _ = CoInitialize(None);

                    let taskbar_list: Result<ITaskbarList3, _> = CoCreateInstance(
                        &TaskbarList,
                        None,
                        CLSCTX_INPROC_SERVER,
                    );

                    if let Ok(taskbar_list) = taskbar_list {
                        let hwnd = HWND(hwnd.0 as _);
                        
                        if count > 0 {
                            if let Ok(icon) = create_red_dot_icon() {
                                let _ = taskbar_list.SetOverlayIcon(hwnd, icon, windows::core::w!("Unread Messages"));
                                let _ = DestroyIcon(icon);
                            }
                        } else {
                            let _ = taskbar_list.SetOverlayIcon(hwnd, None, windows::core::w!(""));
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}
