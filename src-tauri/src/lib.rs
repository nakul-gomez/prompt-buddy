use tauri::{Manager, Runtime, WebviewWindow};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn setup_window_effects<R: Runtime>(window: WebviewWindow<R>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::window::{Effect, EffectState};
        
        window
            .set_effects(tauri::utils::config::WindowEffectsConfig {
                effects: vec![Effect::UnderWindowBackground],
                state: Some(EffectState::Active),
                radius: Some(8.0),
                color: None,
            })
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectState};
        
        window
            .set_effects(tauri::utils::config::WindowEffectsConfig {
                effects: vec![Effect::Acrylic],
                state: Some(EffectState::Active),
                radius: Some(8.0),
                color: None,
            })
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, setup_window_effects])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // Apply window effects on startup
            #[cfg(any(target_os = "macos", target_os = "windows"))]
            {
                let _ = setup_window_effects(window);
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
