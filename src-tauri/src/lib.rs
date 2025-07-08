use tauri::{Manager, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use enigo::{Enigo, Keyboard, Settings};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_accessibility_permissions() -> Result<bool, String> {
    println!("🔍 Checking accessibility permissions...");
    
    #[cfg(target_os = "macos")]
    {
        // On macOS, try to create an Enigo instance to check permissions
        match Enigo::new(&Settings::default()) {
            Ok(_) => {
                println!("✅ Accessibility permissions appear to be granted");
                Ok(true)
            }
            Err(e) => {
                println!("❌ Accessibility permissions issue: {}", e);
                Ok(false)
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        println!("ℹ️  Not on macOS, skipping accessibility check");
        Ok(true)
    }
}

#[tauri::command]
async fn toggle_window_visibility(app: tauri::AppHandle) -> Result<String, String> {
    println!("🔄 Manual window toggle requested");
    
    if let Some(window) = app.get_webview_window("main") {
        println!("✅ Found main window");
        match window.is_visible() {
            Ok(is_visible) => {
                println!("👁️  Current window visibility: {}", is_visible);
                if is_visible {
                    println!("🫥 Hiding prompt picker window");
                    window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
                    Ok("Window hidden".to_string())
                } else {
                    println!("👁️  Showing prompt picker window");
                    window.show().map_err(|e| format!("Failed to show window: {}", e))?;
                    let _ = window.set_focus();
                    Ok("Window shown".to_string())
                }
            }
            Err(e) => {
                println!("❌ Failed to get window visibility: {}", e);
                // If we can't get visibility, just try to show it
                println!("🔄 Attempting to show window anyway...");
                window.show().map_err(|e| format!("Failed to show window: {}", e))?;
                Ok("Window shown (fallback)".to_string())
            }
        }
    } else {
        println!("❌ Could not find main window");
        Err("Could not find main window".to_string())
    }
}

#[tauri::command]
async fn inject_text(text: String) -> Result<String, String> {
    println!("🚀 Starting text injection...");
    println!("📝 Text to inject: '{}'", text);
    println!("📏 Text length: {} characters", text.len());
    
    if text.is_empty() {
        let error_msg = "❌ Cannot inject empty text";
        println!("{}", error_msg);
        return Err(error_msg.to_string());
    }
    
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| {
        let error_msg = format!("❌ Failed to initialize input system: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;
    
    println!("⏱️  Waiting 500ms for user to refocus text field...");
    // Longer delay to give user time to click back to the text field
    std::thread::sleep(std::time::Duration::from_millis(500));
    
    println!("⌨️  Attempting to type text...");
    
    // Try to type the text
    match enigo.text(&text) {
        Ok(_) => {
            println!("✅ Text injection completed successfully");
            Ok("Text injected successfully".to_string())
        },
        Err(e) => {
            let error_msg = format!("❌ Text injection failed: {}. This usually means no text field is currently focused or the app needs accessibility permissions.", e);
            println!("{}", error_msg);
            Err("No active text field found or missing accessibility permissions. Please:\n1. Click on a text field to focus it\n2. Check System Preferences > Security & Privacy > Privacy > Accessibility".to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, inject_text, check_accessibility_permissions, toggle_window_visibility])
        .setup(|app| {
            println!("🔧 Setting up global shortcuts with handlers...");
            
            // Register main shortcut with handler in one step
            println!("🎯 Registering main toggle shortcut...");
            let main_shortcut: Shortcut = "cmd+shift+enter".parse().map_err(|e| format!("Failed to parse main shortcut: {}", e))?;
            match app.handle().global_shortcut().on_shortcut(main_shortcut, move |_app, _shortcut, _state| {
                println!("🎯 Global shortcut triggered!");
                
                if let Some(window) = _app.get_webview_window("main") {
                    println!("✅ Found main window");
                    match window.is_visible() {
                        Ok(is_visible) => {
                            println!("👁️  Current window visibility: {}", is_visible);
                            if is_visible {
                                println!("🫥 Hiding prompt picker bar");
                                if let Err(e) = window.hide() {
                                    println!("❌ Failed to hide window: {}", e);
                                }
                            } else {
                                println!("👁️  Showing prompt picker bar");
                                if let Err(e) = window.show() {
                                    println!("❌ Failed to show window: {}", e);
                                } else {
                                    println!("✅ Window shown successfully");
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        Err(e) => {
                            println!("❌ Failed to get window visibility: {}", e);
                            // If we can't get visibility, just try to show it
                            println!("🔄 Attempting to show window anyway...");
                            if let Err(e) = window.show() {
                                println!("❌ Failed to show window: {}", e);
                            } else {
                                let _ = window.set_focus();
                            }
                        }
                    }
                } else {
                    println!("❌ Could not find main window");
                }
            }) {
                Ok(_) => {
                    println!("✅ Main shortcut (cmd+shift+enter) registered successfully!");
                }
                Err(e) => {
                    println!("❌ Failed to register main shortcut: {}", e);
                    println!("⚠️  You can still use the app manually, but cmd+shift+enter won't work");
                }
            }
            
            // Register prompt injection shortcuts with handlers
            println!("🎯 Registering prompt injection shortcuts...");
            let mut successful_shortcuts = 0;
            for i in 1..=9 {
                let shortcut_str = format!("cmd+alt+{}", i);
                let prompt_index = i - 1; // Convert to 0-based index
                
                match shortcut_str.parse::<Shortcut>() {
                    Ok(shortcut) => {
                        match app.handle().global_shortcut().on_shortcut(shortcut, move |app, _shortcut, _state| {
                            println!("🚀 Prompt shortcut triggered: Cmd+Alt+{}", i);
                            
                            // Emit event to frontend to trigger injection
                            if let Some(window) = app.get_webview_window("main") {
                                if let Err(e) = window.emit("inject-prompt", prompt_index) {
                                    println!("❌ Failed to emit inject-prompt event: {}", e);
                                } else {
                                    println!("✅ Emitted inject-prompt event for index: {}", prompt_index);
                                }
                            }
                        }) {
                            Ok(_) => {
                                println!("✅ Registered: {}", shortcut_str);
                                successful_shortcuts += 1;
                            }
                            Err(e) => {
                                println!("❌ Failed to register {}: {} (probably conflicts with another app)", shortcut_str, e);
                            }
                        }
                    }
                    Err(e) => {
                        println!("❌ Failed to parse shortcut {}: {}", shortcut_str, e);
                    }
                }
            }
            
            if successful_shortcuts == 0 {
                println!("⚠️  No prompt shortcuts could be registered - they may conflict with existing shortcuts");
                println!("💡 You can still use the app's interface to select and inject prompts");
            } else {
                println!("🎯 Successfully registered {} out of 9 prompt shortcuts", successful_shortcuts);
            }
            
            println!("🎯 Prompt Picker initialized successfully!");
            println!("📋 Use Cmd+Shift+Enter to show/hide the prompt picker bar");
            println!("🎯 Use Cmd+Alt+1-9 to inject prompts");
            println!("⚠️  Note: On macOS, you may need to grant accessibility permissions");
            
            // Show window on first launch for better user experience
            if let Some(window) = app.get_webview_window("main") {
                println!("👁️  Showing bar on first launch");
                let _ = window.show();
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
