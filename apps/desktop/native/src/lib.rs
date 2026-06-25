use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    env,
    ffi::OsStr,
    fs,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    path::{Path, PathBuf},
    process::Command,
    time::{Duration, Instant},
};
use thiserror::Error;

const KIVRA_HOME_DIRECTORY: &str = ".kivra";
const CAPTURED_RUNS_DIRECTORY: &str = "captured-runs";
const CAPTURE_START_FILE: &str = "start.json";
const CAPTURE_EVENTS_FILE: &str = "events.jsonl";
const CAPTURE_END_FILE: &str = "end.json";
const SHELL_STREAM_HELPER_FILE: &str = "shell-stream.mjs";
const SHELL_INTEGRATION_FILE: &str = "zsh-integration.zsh";
const JETBRAINS_PLUGIN_DIRECTORY: &str = "kivra-jetbrains";
const VSCODE_EXTENSION_ID: &str = "kivra.kivra-vscode";

#[derive(Debug, Error)]
enum KivraError {
    #[error("Path does not exist")]
    PathNotFound,
    #[error("Path is not a directory")]
    NotDirectory,
    #[error("Path is not a file")]
    NotFile,
    #[error("Unable to read filesystem: {0}")]
    Filesystem(String),
    #[error("Unable to run command: {0}")]
    Command(String),
    #[error("File is outside the project")]
    FileOutsideProject,
    #[error("Only HTTPS URLs can be opened externally")]
    InvalidExternalUrl,
    #[error("Unable to receive auth callback: {0}")]
    AuthCallback(String),
    #[error("Unable to exchange auth code: {0}")]
    AuthExchange(String),
}

impl Serialize for KivraError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectNode {
    id: String,
    name: String,
    path: String,
    #[serde(rename = "type")]
    node_type: String,
    children: Option<Vec<ProjectNode>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScannedProject {
    name: String,
    path: String,
    runtime: String,
    framework: String,
    package_manager: String,
    branch: String,
    repository_url: Option<String>,
    tree: ProjectNode,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DetectedError {
    error_code: String,
    message: String,
    stack_trace: String,
    file_path: Option<String>,
    line_number: Option<u32>,
    column_number: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunResult {
    command: String,
    status: String,
    duration: u128,
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
    errors: Vec<DetectedError>,
    created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CapturedRunResult {
    id: String,
    #[serde(skip_serializing)]
    project_path: Option<String>,
    command: String,
    status: String,
    duration: u128,
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
    errors: Vec<DetectedError>,
    created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CapturedRunStart {
    #[allow(dead_code)]
    protocol_version: Option<u8>,
    id: String,
    project_path: Option<String>,
    command: String,
    started_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CapturedRunEnd {
    #[allow(dead_code)]
    protocol_version: Option<u8>,
    exit_code: Option<i32>,
    duration_ms: Option<u128>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CapturedRunEvent {
    #[allow(dead_code)]
    protocol_version: Option<u8>,
    stream: String,
    data: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectFile {
    path: String,
    content: String,
    size: u64,
    truncated: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct IntegrationInstallResult {
    message_key: String,
    paths: Vec<String>,
    restart_required: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct IntegrationStatus {
    shell_installed: bool,
    shell_integration_path: String,
    jetbrains_installed: bool,
    jetbrains_partially_installed: bool,
    jetbrains_install_paths: Vec<String>,
    jetbrains_missing_install_paths: Vec<String>,
    jetbrains_plugins: Vec<JetBrainsPluginStatus>,
    vscode_installed: bool,
    vscode_cli_path: Option<String>,
}

#[derive(Debug, Clone)]
struct JetBrainsPluginRoot {
    display_name: String,
    plugin_root: PathBuf,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct JetBrainsPluginStatus {
    display_name: String,
    path: String,
    installed: bool,
}

#[derive(Debug, Serialize)]
struct AuthSessionTokens {
    access_token: String,
    refresh_token: String,
    expires_at: Option<u64>,
    expires_in: Option<u64>,
    provider_refresh_token: Option<String>,
    provider_token: Option<String>,
    token_type: Option<String>,
    user: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct AuthTokenExchangeRequest<'a> {
    auth_code: &'a str,
    code_verifier: &'a str,
}

#[derive(Debug, Deserialize)]
struct AuthTokenExchangeResponse {
    access_token: String,
    refresh_token: String,
    expires_at: Option<u64>,
    expires_in: Option<u64>,
    provider_refresh_token: Option<String>,
    provider_token: Option<String>,
    token_type: Option<String>,
    user: serde_json::Value,
}

#[tauri::command]
fn scan_project(project_path: String) -> Result<ScannedProject, KivraError> {
    let root_path = PathBuf::from(project_path);

    if !root_path.exists() {
        return Err(KivraError::PathNotFound);
    }

    if !root_path.is_dir() {
        return Err(KivraError::NotDirectory);
    }

    let name = root_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("project")
        .to_string();
    let tree = build_project_tree(&root_path, &root_path, 0)?;

    Ok(ScannedProject {
        name: detect_project_name(&root_path).unwrap_or(name),
        path: root_path.to_string_lossy().to_string(),
        runtime: detect_runtime(&root_path),
        framework: detect_framework(&root_path),
        package_manager: detect_package_manager(&root_path),
        branch: read_git_output(&root_path, ["rev-parse", "--abbrev-ref", "HEAD"])
            .unwrap_or_else(|| "unknown".to_string()),
        repository_url: read_git_output(&root_path, ["config", "--get", "remote.origin.url"]),
        tree,
    })
}

#[tauri::command]
fn read_project_directory(
    project_path: String,
    directory_path: String,
) -> Result<Vec<ProjectNode>, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let directory_path = PathBuf::from(directory_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !directory_path.starts_with(&root_path) {
        return Err(KivraError::FileOutsideProject);
    }

    if !directory_path.is_dir() {
        return Err(KivraError::NotDirectory);
    }

    read_children(&root_path, &directory_path, 0)
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), KivraError> {
    if !url.starts_with("https://") {
        return Err(KivraError::InvalidExternalUrl);
    }

    let output = if cfg!(target_os = "macos") {
        Command::new("open").arg(&url).output()
    } else if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", "start", "", &url]).output()
    } else {
        Command::new("xdg-open").arg(&url).output()
    }
    .map_err(|error| KivraError::Command(error.to_string()))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(KivraError::Command(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ))
    }
}

#[tauri::command]
async fn wait_for_auth_callback() -> Result<String, KivraError> {
    tauri::async_runtime::spawn_blocking(wait_for_loopback_auth_callback)
        .await
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?
}

#[tauri::command]
async fn exchange_auth_code(
    supabase_url: String,
    supabase_anon_key: String,
    code: String,
    code_verifier: String,
) -> Result<AuthSessionTokens, KivraError> {
    if !supabase_url.starts_with("https://") {
        return Err(KivraError::AuthExchange(
            "Supabase URL must use HTTPS".to_string(),
        ));
    }

    if supabase_anon_key.is_empty() || code.is_empty() || code_verifier.is_empty() {
        return Err(KivraError::AuthExchange(
            "Missing OAuth token exchange input".to_string(),
        ));
    }

    let token_url = format!(
        "{}/auth/v1/token?grant_type=pkce",
        supabase_url.trim_end_matches('/')
    );
    let response = reqwest::Client::new()
        .post(token_url)
        .header("apikey", &supabase_anon_key)
        .bearer_auth(&supabase_anon_key)
        .json(&AuthTokenExchangeRequest {
            auth_code: &code,
            code_verifier: &code_verifier,
        })
        .send()
        .await
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;

    if !status.is_success() {
        return Err(KivraError::AuthExchange(format!(
            "Supabase token exchange failed ({status}): {body}"
        )));
    }

    let session = serde_json::from_str::<AuthTokenExchangeResponse>(&body)
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;

    Ok(AuthSessionTokens {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        provider_refresh_token: session.provider_refresh_token,
        provider_token: session.provider_token,
        token_type: session.token_type,
        user: session.user,
    })
}

fn wait_for_loopback_auth_callback() -> Result<String, KivraError> {
    let listener = TcpListener::bind("127.0.0.1:3000")
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;
    listener
        .set_nonblocking(true)
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;

    let started_at = Instant::now();

    loop {
        match listener.accept() {
            Ok((stream, _)) => return read_auth_callback_request(stream),
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                if started_at.elapsed() > Duration::from_secs(120) {
                    return Err(KivraError::AuthCallback(
                        "Timed out waiting for OAuth redirect".to_string(),
                    ));
                }

                std::thread::sleep(Duration::from_millis(100));
            }
            Err(error) => return Err(KivraError::AuthCallback(error.to_string())),
        }
    }
}

fn read_auth_callback_request(mut stream: TcpStream) -> Result<String, KivraError> {
    let mut buffer = [0_u8; 4096];
    let byte_count = stream
        .read(&mut buffer)
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;
    let request = String::from_utf8_lossy(&buffer[..byte_count]);
    let request_target = request
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .ok_or_else(|| KivraError::AuthCallback("Invalid OAuth callback request".to_string()))?;

    let response = concat!(
        "HTTP/1.1 200 OK\r\n",
        "Content-Type: text/html; charset=utf-8\r\n",
        "Connection: close\r\n",
        "\r\n",
        "<!doctype html><html lang=\"en\"><head>",
        "<meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<title>Kivra sign-in complete</title>",
        "<style>",
        ":root{color-scheme:dark}",
        "*{box-sizing:border-box}",
        "body{margin:0;min-height:100vh;display:grid;place-items:center;",
        "font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;",
        "background:radial-gradient(circle at 50% 0%,#1d2738 0,#0d1321 44%,#090d16 100%);",
        "color:#eef4ff}",
        "main{width:min(440px,calc(100vw - 40px));text-align:center}",
        ".mark{width:64px;height:64px;margin:0 auto 22px;border-radius:18px;",
        "display:grid;place-items:center;background:#d7f8d1;color:#122316;",
        "box-shadow:0 20px 60px rgba(36,217,102,.24)}",
        ".mark svg{width:34px;height:34px}",
        ".eyebrow{margin:0 0 10px;color:#8ea1bd;font-size:12px;font-weight:700;",
        "letter-spacing:.14em;text-transform:uppercase}",
        "h1{font-size:30px;line-height:1.12;margin:0;color:#f8fbff}",
        "p{font-size:15px;line-height:1.7;color:#aebbd0;margin:16px 0 0}",
        ".panel{margin-top:26px;border:1px solid rgba(255,255,255,.1);",
        "background:rgba(255,255,255,.055);border-radius:12px;padding:14px 16px;",
        "display:flex;align-items:center;justify-content:center;gap:10px;",
        "color:#d7e1f2;font-size:13px}",
        ".dot{width:8px;height:8px;border-radius:999px;background:#7ef08a;",
        "box-shadow:0 0 0 6px rgba(126,240,138,.12)}",
        ".brand{position:fixed;left:24px;top:22px;font-size:14px;font-weight:800;",
        "letter-spacing:.04em;color:#edf4ff}",
        "</style></head><body><main>",
        "<div class=\"brand\">Kivra</div>",
        "<div class=\"mark\" aria-hidden=\"true\">",
        "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" ",
        "stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\">",
        "<path d=\"M20 6 9 17l-5-5\"/></svg></div>",
        "<p class=\"eyebrow\">GitHub connected</p>",
        "<h1>You're signed in.</h1>",
        "<p>Kivra has received the secure callback and is finishing sign-in ",
        "inside the desktop app.</p>",
        "<div class=\"panel\"><span class=\"dot\"></span>",
        "<span>You can close this tab and return to Kivra.</span></div>",
        "</main>",
        "</body></html>"
    );

    stream
        .write_all(response.as_bytes())
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;

    Ok(format!("http://127.0.0.1:3000{request_target}"))
}

#[tauri::command]
fn run_project_command(project_path: String, command: String) -> Result<RunResult, KivraError> {
    let started_at = Instant::now();
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", &command])
            .current_dir(&project_path)
            .output()
    } else {
        Command::new("sh")
            .args(["-lc", &command])
            .current_dir(&project_path)
            .output()
    }
    .map_err(|error| KivraError::Command(error.to_string()))?;
    let duration = started_at.elapsed().as_millis();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let is_success = output.status.success();
    let combined_output = format!("{stdout}\n{stderr}");
    let errors = if is_success {
        Vec::new()
    } else {
        parse_errors(&combined_output)
    };

    Ok(RunResult {
        command,
        status: if is_success {
            "SUCCESS".to_string()
        } else {
            "FAILED".to_string()
        },
        duration,
        stdout,
        stderr,
        exit_code: output.status.code(),
        errors,
        created_at: current_timestamp(),
    })
}

#[tauri::command]
fn read_project_file(project_path: String, file_path: String) -> Result<ProjectFile, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let target_path = PathBuf::from(file_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !target_path.starts_with(&root_path) {
        return Err(KivraError::FileOutsideProject);
    }

    let metadata =
        fs::metadata(&target_path).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !metadata.is_file() {
        return Err(KivraError::NotFile);
    }

    let max_size = 512 * 1024;
    let content = fs::read_to_string(&target_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let truncated = content.len() > max_size;
    let visible_content = if truncated {
        content.chars().take(max_size).collect::<String>()
    } else {
        content
    };

    Ok(ProjectFile {
        path: target_path.to_string_lossy().to_string(),
        content: visible_content,
        size: metadata.len(),
        truncated,
    })
}

#[tauri::command]
fn get_integration_status() -> Result<IntegrationStatus, KivraError> {
    let kivra_home = kivra_home_dir()?;
    let shell_integration_path = kivra_home.join("shell").join(SHELL_INTEGRATION_FILE);
    let shell_helper_path = kivra_home
        .join("trace-runtime")
        .join(SHELL_STREAM_HELPER_FILE);
    let source_line = format!(
        "source {}",
        shell_quote(&shell_integration_path.to_string_lossy())
    );
    let zshrc_path = home_dir()?.join(".zshrc");
    let zshrc_content = fs::read_to_string(&zshrc_path).unwrap_or_default();
    let jetbrains_plugins = jetbrains_plugin_statuses()?;
    let jetbrains_install_paths = jetbrains_plugins
        .iter()
        .filter(|plugin| plugin.installed)
        .map(|plugin| plugin.path.clone())
        .collect::<Vec<_>>();
    let jetbrains_missing_install_paths = jetbrains_plugins
        .iter()
        .filter(|plugin| !plugin.installed)
        .map(|plugin| plugin.path.clone())
        .collect::<Vec<_>>();
    let vscode_cli_path = vscode_cli_path();
    let vscode_installed = vscode_cli_path
        .as_ref()
        .is_some_and(|path| vscode_extension_installed(path));

    Ok(IntegrationStatus {
        shell_installed: shell_integration_path.exists()
            && shell_helper_path.exists()
            && zshrc_content.contains(&source_line),
        shell_integration_path: shell_integration_path.to_string_lossy().to_string(),
        jetbrains_installed: !jetbrains_install_paths.is_empty()
            && jetbrains_missing_install_paths.is_empty(),
        jetbrains_partially_installed: !jetbrains_install_paths.is_empty()
            && !jetbrains_missing_install_paths.is_empty(),
        jetbrains_install_paths,
        jetbrains_missing_install_paths,
        jetbrains_plugins,
        vscode_installed,
        vscode_cli_path: vscode_cli_path.map(|path| path.to_string_lossy().to_string()),
    })
}

#[tauri::command]
fn install_shell_capture() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let helper_source_path = repo_root.join("tools").join("kivra-shell-stream.mjs");

    if !helper_source_path.exists() {
        return Err(KivraError::Filesystem(format!(
            "{} not found",
            helper_source_path.to_string_lossy()
        )));
    }

    let home = home_dir()?;
    let kivra_home = home.join(KIVRA_HOME_DIRECTORY);
    let runtime_dir = kivra_home.join("trace-runtime");
    let shell_dir = kivra_home.join("shell");
    let helper_path = runtime_dir.join(SHELL_STREAM_HELPER_FILE);
    let integration_path = shell_dir.join(SHELL_INTEGRATION_FILE);
    let zshrc_path = home.join(".zshrc");
    let source_line = format!(
        "source {}",
        shell_quote(&integration_path.to_string_lossy())
    );
    let integration_content = shell_integration_content(&kivra_home, &helper_path);

    if cfg!(target_os = "macos") {
        if install_shell_capture_with_admin(
            &helper_source_path,
            &runtime_dir,
            &shell_dir,
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &integration_content,
            &home,
        )
        .is_err()
        {
            install_shell_capture_direct(
                &helper_source_path,
                &runtime_dir,
                &shell_dir,
                &helper_path,
                &integration_path,
                &zshrc_path,
                &source_line,
                &integration_content,
            )?;
        }
    } else {
        install_shell_capture_direct(
            &helper_source_path,
            &runtime_dir,
            &shell_dir,
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &integration_content,
        )?;
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.shell.installSuccess".to_string(),
        paths: vec![
            integration_path.to_string_lossy().to_string(),
            helper_path.to_string_lossy().to_string(),
            zshrc_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

#[tauri::command]
fn uninstall_shell_capture() -> Result<IntegrationInstallResult, KivraError> {
    let home = home_dir()?;
    let kivra_home = home.join(KIVRA_HOME_DIRECTORY);
    let helper_path = kivra_home
        .join("trace-runtime")
        .join(SHELL_STREAM_HELPER_FILE);
    let integration_path = kivra_home.join("shell").join(SHELL_INTEGRATION_FILE);
    let zshrc_path = home.join(".zshrc");
    let source_line = format!(
        "source {}",
        shell_quote(&integration_path.to_string_lossy())
    );

    if cfg!(target_os = "macos") {
        if uninstall_shell_capture_with_admin(
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &home,
        )
        .is_err()
        {
            uninstall_shell_capture_direct(
                &helper_path,
                &integration_path,
                &zshrc_path,
                &source_line,
            )?;
        }
    } else {
        uninstall_shell_capture_direct(&helper_path, &integration_path, &zshrc_path, &source_line)?;
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.shell.uninstallSuccess".to_string(),
        paths: vec![
            integration_path.to_string_lossy().to_string(),
            helper_path.to_string_lossy().to_string(),
            zshrc_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

#[tauri::command]
fn install_jetbrains_plugin() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let plugin_zip_path = ensure_jetbrains_plugin_zip(&repo_root)?;
    let plugin_roots = jetbrains_plugin_roots()?
        .into_iter()
        .map(|plugin| plugin.plugin_root)
        .collect::<Vec<_>>();

    if plugin_roots.is_empty() {
        return Err(KivraError::Filesystem(
            "No JetBrains IDE configuration folders were found.".to_string(),
        ));
    }

    let installed_paths = install_jetbrains_plugin_to_roots(&plugin_zip_path, plugin_roots, true)?;

    Ok(IntegrationInstallResult {
        message_key: "settings.jetbrains.installSuccess".to_string(),
        paths: installed_paths,
        restart_required: true,
    })
}

#[tauri::command]
fn install_missing_jetbrains_plugins() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let plugin_zip_path = ensure_jetbrains_plugin_zip(&repo_root)?;
    let plugin_roots = missing_jetbrains_plugin_roots()?;

    if plugin_roots.is_empty() {
        return Ok(IntegrationInstallResult {
            message_key: "settings.jetbrains.noMissingSuccess".to_string(),
            paths: Vec::new(),
            restart_required: false,
        });
    }

    let installed_paths = install_jetbrains_plugin_to_roots(&plugin_zip_path, plugin_roots, false)?;

    Ok(IntegrationInstallResult {
        message_key: "settings.jetbrains.installMissingSuccess".to_string(),
        paths: installed_paths,
        restart_required: true,
    })
}

#[tauri::command]
fn install_vscode_extension() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let cli_path = vscode_cli_path()
        .ok_or_else(|| KivraError::Command("Visual Studio Code CLI was not found.".to_string()))?;
    let vsix_path = ensure_vscode_extension_vsix(&repo_root)?;
    let output = Command::new(&cli_path)
        .args([
            "--install-extension",
            &vsix_path.to_string_lossy(),
            "--force",
        ])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(command_failure(
            "Unable to install VS Code extension",
            &output,
        ));
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.vscode.installSuccess".to_string(),
        paths: vec![
            cli_path.to_string_lossy().to_string(),
            vsix_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

#[tauri::command]
fn read_captured_runs(project_path: String) -> Result<Vec<CapturedRunResult>, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let mut runs = Vec::new();

    runs.extend(read_captured_runs_from_dir(
        &root_path
            .join(KIVRA_HOME_DIRECTORY)
            .join(CAPTURED_RUNS_DIRECTORY),
        Some(&root_path),
    )?);
    runs.extend(read_central_captured_runs(&root_path)?);

    runs.sort_by(|first_run, second_run| second_run.created_at.cmp(&first_run.created_at));
    runs.dedup_by(|first_run, second_run| first_run.id == second_run.id);

    Ok(runs)
}

fn read_captured_runs_from_dir(
    captured_path: &Path,
    project_path: Option<&Path>,
) -> Result<Vec<CapturedRunResult>, KivraError> {
    if !captured_path.exists() {
        return Ok(Vec::new());
    }

    Ok(fs::read_dir(captured_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| read_captured_run(&entry.path()).ok())
        .filter(|run| {
            project_path
                .map(|path| run.project_path.as_deref() == Some(&path.to_string_lossy()))
                .unwrap_or(true)
        })
        .filter(|run| !run.stdout.trim().is_empty() || !run.stderr.trim().is_empty())
        .collect::<Vec<_>>())
}

fn read_central_captured_runs(project_path: &Path) -> Result<Vec<CapturedRunResult>, KivraError> {
    let central_path = kivra_home_dir()?.join(CAPTURED_RUNS_DIRECTORY);

    if !central_path.exists() {
        return Ok(Vec::new());
    }

    let mut runs = Vec::new();

    for entry in
        fs::read_dir(&central_path).map_err(|error| KivraError::Filesystem(error.to_string()))?
    {
        let entry = entry.map_err(|error| KivraError::Filesystem(error.to_string()))?;

        if entry.path().is_dir() {
            runs.extend(read_captured_runs_from_dir(
                &entry.path(),
                Some(project_path),
            )?);
        }
    }

    Ok(runs)
}

#[tauri::command]
fn sync_trace_projects(project_paths: Vec<String>) -> Result<String, KivraError> {
    let trace_projects_path = trace_projects_file_path()?;
    let mut local_project_paths = project_paths
        .into_iter()
        .filter_map(|project_path| PathBuf::from(project_path).canonicalize().ok())
        .filter(|project_path| project_path.is_dir())
        .map(|project_path| project_path.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    local_project_paths.sort();
    local_project_paths.dedup();

    if let Some(parent_path) = trace_projects_path.parent() {
        fs::create_dir_all(parent_path)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    }

    fs::write(
        &trace_projects_path,
        serde_json::to_string_pretty(&local_project_paths)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?,
    )
    .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    Ok(trace_projects_path.to_string_lossy().to_string())
}

#[tauri::command]
fn start_trace_agent(project_paths: Vec<String>) -> Result<(), KivraError> {
    sync_trace_projects(project_paths)?;
    Ok(())
}

fn read_captured_run(run_path: &Path) -> Result<CapturedRunResult, KivraError> {
    let start_content = fs::read_to_string(run_path.join(CAPTURE_START_FILE))
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let start = serde_json::from_str::<CapturedRunStart>(&start_content)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let end = fs::read_to_string(run_path.join(CAPTURE_END_FILE))
        .ok()
        .and_then(|content| serde_json::from_str::<CapturedRunEnd>(&content).ok());
    let events_content = fs::read_to_string(run_path.join(CAPTURE_EVENTS_FILE)).unwrap_or_default();
    let mut stdout = String::new();
    let mut stderr = String::new();

    for line in events_content
        .lines()
        .filter(|line| !line.trim().is_empty())
    {
        let event = serde_json::from_str::<CapturedRunEvent>(line)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;

        if event.stream == "stderr" {
            stderr.push_str(&sanitize_captured_output(&event.data));
        } else {
            stdout.push_str(&sanitize_captured_output(&event.data));
        }
    }

    let combined_output = format!("{stdout}\n{stderr}");
    let lower_output = combined_output.to_lowercase();
    let errors = if lower_output.contains("error")
        || lower_output.contains("failed")
        || lower_output.contains("cannot ")
        || lower_output.contains("module not found")
    {
        parse_errors(&combined_output)
    } else {
        Vec::new()
    };
    let exit_code = end.as_ref().and_then(|end| end.exit_code);
    let duration = end
        .as_ref()
        .and_then(|end| end.duration_ms)
        .unwrap_or_default();
    let status = if exit_code.is_some_and(|code| code != 0) || !errors.is_empty() {
        "FAILED"
    } else {
        "SUCCESS"
    }
    .to_string();

    Ok(CapturedRunResult {
        id: start.id,
        project_path: start.project_path,
        command: start.command,
        status,
        duration,
        stdout,
        stderr,
        exit_code,
        errors,
        created_at: start.started_at,
    })
}

fn build_project_tree(
    root_path: &Path,
    current_path: &Path,
    depth: usize,
) -> Result<ProjectNode, KivraError> {
    let metadata =
        fs::metadata(current_path).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let name = current_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or_else(|| root_path.to_str().unwrap_or("project"))
        .to_string();
    let path = current_path.to_string_lossy().to_string();

    if metadata.is_file() {
        return Ok(ProjectNode {
            id: path.clone(),
            name,
            path,
            node_type: "file".to_string(),
            children: None,
        });
    }

    let children = if depth < 1 {
        Some(read_children(root_path, current_path, depth)?)
    } else {
        None
    };

    Ok(ProjectNode {
        id: path.clone(),
        name,
        path,
        node_type: "folder".to_string(),
        children,
    })
}

fn sanitize_captured_output(value: &str) -> String {
    let mut output = String::new();
    let mut chars = value.chars().peekable();

    while let Some(character) = chars.next() {
        if character == '\u{1b}' {
            match chars.peek().copied() {
                Some(']') => {
                    chars.next();
                    skip_until_osc_end(&mut chars);
                }
                Some('[') => {
                    chars.next();
                    skip_until_csi_end(&mut chars);
                }
                _ => {}
            }
            continue;
        }

        if character == ']' {
            let mut probe = chars.clone();
            let marker = ['1', '3', '4', '1', ';'];
            let is_command_marker = marker
                .iter()
                .all(|expected| probe.next() == Some(*expected));

            if is_command_marker {
                for _ in marker {
                    chars.next();
                }
                skip_until_bel(&mut chars);
                continue;
            }
        }

        if character == '\n'
            || character == '\t'
            || (!character.is_control() && character != '\u{7f}')
        {
            output.push(character);
        }
    }

    output
}

fn skip_until_osc_end<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    while let Some(character) = chars.next() {
        if character == '\u{7}' {
            break;
        }

        if character == '\u{1b}' && chars.peek() == Some(&'\\') {
            chars.next();
            break;
        }
    }
}

fn skip_until_bel<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    for character in chars.by_ref() {
        if character == '\u{7}' {
            break;
        }
    }
}

fn skip_until_csi_end<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    for character in chars.by_ref() {
        if ('@'..='~').contains(&character) {
            break;
        }
    }
}

fn read_children(
    root_path: &Path,
    current_path: &Path,
    depth: usize,
) -> Result<Vec<ProjectNode>, KivraError> {
    let ignored_names = HashSet::from([
        ".git",
        ".next",
        "dist",
        "node_modules",
        "target",
        ".turbo",
        ".venv",
    ]);
    let mut entries = fs::read_dir(current_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .file_name()
                .to_str()
                .map(|name| !ignored_names.contains(name))
                .unwrap_or(false)
        })
        .collect::<Vec<_>>();

    entries.sort_by_key(|entry| {
        let is_file = entry.path().is_file();
        (is_file, entry.file_name())
    });

    entries
        .into_iter()
        .map(|entry| build_project_tree(root_path, &entry.path(), depth + 1))
        .collect()
}

fn detect_project_name(root_path: &Path) -> Option<String> {
    let package_json = fs::read_to_string(root_path.join("package.json")).ok()?;
    let value = serde_json::from_str::<serde_json::Value>(&package_json).ok()?;
    value
        .get("name")
        .and_then(serde_json::Value::as_str)
        .map(ToString::to_string)
}

fn detect_runtime(root_path: &Path) -> String {
    if root_path.join("Cargo.toml").exists() {
        return "Rust".to_string();
    }

    if root_path.join("package.json").exists() {
        return "Node.js".to_string();
    }

    if root_path.join("pyproject.toml").exists() {
        return "Python".to_string();
    }

    if root_path.join("go.mod").exists() {
        return "Go".to_string();
    }

    "unknown".to_string()
}

fn detect_framework(root_path: &Path) -> String {
    let package_json = fs::read_to_string(root_path.join("package.json")).unwrap_or_default();

    if package_json.contains("\"next\"") {
        return "Next.js".to_string();
    }

    if package_json.contains("\"@vitejs/plugin-react\"") || package_json.contains("\"vite\"") {
        return "Vite".to_string();
    }

    if package_json.contains("\"react\"") {
        return "React".to_string();
    }

    if root_path.join("native/tauri.conf.json").exists()
        || root_path.join("tauri.conf.json").exists()
    {
        return "Tauri".to_string();
    }

    "unknown".to_string()
}

fn detect_package_manager(root_path: &Path) -> String {
    if root_path.join("pnpm-lock.yaml").exists() || root_path.join("pnpm-workspace.yaml").exists() {
        return "pnpm".to_string();
    }

    if root_path.join("yarn.lock").exists() {
        return "yarn".to_string();
    }

    if root_path.join("package-lock.json").exists() {
        return "npm".to_string();
    }

    if root_path.join("bun.lockb").exists() {
        return "bun".to_string();
    }

    "unknown".to_string()
}

fn read_git_output<const N: usize>(root_path: &Path, args: [&str; N]) -> Option<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(root_path)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let value = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}

fn parse_errors(output: &str) -> Vec<DetectedError> {
    let mut errors = output
        .lines()
        .filter(|line| {
            let lower = line.to_lowercase();
            lower.contains("error")
                || lower.contains("failed")
                || lower.contains("cannot ")
                || lower.contains("module not found")
        })
        .map(|line| build_detected_error(line, output))
        .collect::<Vec<_>>();

    if errors.is_empty() && !output.trim().is_empty() {
        errors = output
            .lines()
            .find(|line| !line.trim().is_empty())
            .map(|line| vec![build_detected_error(line, output)])
            .unwrap_or_default();
    }

    errors
}

fn build_detected_error(message: &str, output: &str) -> DetectedError {
    let (file_path, line_number, column_number) = extract_source_location(message);

    DetectedError {
        error_code: "RUN_FAILED".to_string(),
        message: message.trim().to_string(),
        stack_trace: output.to_string(),
        file_path,
        line_number,
        column_number,
    }
}

fn extract_source_location(message: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    let tokens = message.split_whitespace().collect::<Vec<_>>();

    for token in tokens {
        let normalized = token.trim_matches(|character: char| {
            character == '(' || character == ')' || character == ',' || character == ';'
        });
        let parts = normalized.split(':').collect::<Vec<_>>();

        if parts.len() >= 2 && looks_like_file_path(parts[0]) {
            let line_number = parts.get(1).and_then(|value| value.parse::<u32>().ok());
            let column_number = parts.get(2).and_then(|value| value.parse::<u32>().ok());

            return (Some(parts[0].to_string()), line_number, column_number);
        }
    }

    (None, None, None)
}

fn looks_like_file_path(value: &str) -> bool {
    value.contains('/')
        || value.ends_with(".ts")
        || value.ends_with(".tsx")
        || value.ends_with(".js")
        || value.ends_with(".jsx")
        || value.ends_with(".rs")
        || value.ends_with(".py")
        || value.ends_with(".go")
}

fn current_timestamp() -> String {
    Command::new("date")
        .args(["-u", "+%Y-%m-%dT%H:%M:%SZ"])
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "1970-01-01T00:00:00Z".to_string())
}

fn install_shell_capture_with_admin(
    helper_source_path: &Path,
    runtime_dir: &Path,
    shell_dir: &Path,
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    integration_content: &str,
    home: &Path,
) -> Result<(), KivraError> {
    let uid = command_output("id", &["-u"])?;
    let gid = command_output("id", &["-g"])?;
    let script_path =
        env::temp_dir().join(format!("kivra-install-shell-{}.sh", std::process::id()));
    let script = format!(
        r#"#!/bin/sh
set -eu
mkdir -p {runtime_dir} {shell_dir}
cp {helper_source_path} {helper_path}
cat > {integration_path} <<'KIVRA_ZSH_EOF'
{integration_content}
KIVRA_ZSH_EOF
touch {zshrc_path}
if ! /usr/bin/grep -Fqx {source_line} {zshrc_path}; then
  printf '\n# >>> kivra shell capture >>>\n%s\n# <<< kivra shell capture <<<\n' {source_line} >> {zshrc_path}
fi
/usr/sbin/chown -R {uid}:{gid} {home}/.kivra {zshrc_path}
"#,
        runtime_dir = shell_quote(&runtime_dir.to_string_lossy()),
        shell_dir = shell_quote(&shell_dir.to_string_lossy()),
        helper_source_path = shell_quote(&helper_source_path.to_string_lossy()),
        helper_path = shell_quote(&helper_path.to_string_lossy()),
        integration_path = shell_quote(&integration_path.to_string_lossy()),
        integration_content = integration_content,
        zshrc_path = shell_quote(&zshrc_path.to_string_lossy()),
        source_line = shell_quote(source_line),
        uid = uid.trim(),
        gid = gid.trim(),
        home = shell_quote(&home.to_string_lossy()),
    );

    fs::write(&script_path, script).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    let shell_command = format!("/bin/sh {}", shell_quote(&script_path.to_string_lossy()));
    let apple_script = format!(
        "do shell script {} with administrator privileges",
        applescript_quote(&shell_command)
    );
    let output = Command::new("osascript")
        .args(["-e", &apple_script])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;
    let _ = fs::remove_file(&script_path);

    if output.status.success() {
        Ok(())
    } else {
        Err(command_failure("Unable to install shell capture", &output))
    }
}

fn uninstall_shell_capture_with_admin(
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    home: &Path,
) -> Result<(), KivraError> {
    let uid = command_output("id", &["-u"])?;
    let gid = command_output("id", &["-g"])?;
    let script_path =
        env::temp_dir().join(format!("kivra-uninstall-shell-{}.sh", std::process::id()));
    let script = format!(
        r##"#!/bin/sh
set -eu
if [ -f {zshrc_path} ]; then
  tmp_file="$(/usr/bin/mktemp)"
  /usr/bin/awk -v source={source_line} '
    $0 == "# >>> kivra shell capture >>>" {{ skip = 1; next }}
    $0 == "# <<< kivra shell capture <<<" {{ skip = 0; next }}
    skip == 0 && $0 != source {{ print }}
  ' {zshrc_path} > "$tmp_file"
  cat "$tmp_file" > {zshrc_path}
  rm -f "$tmp_file"
fi
rm -f {integration_path} {helper_path}
/usr/sbin/chown -R {uid}:{gid} {home}/.kivra {zshrc_path} 2>/dev/null || true
"##,
        zshrc_path = shell_quote(&zshrc_path.to_string_lossy()),
        source_line = shell_quote(source_line),
        integration_path = shell_quote(&integration_path.to_string_lossy()),
        helper_path = shell_quote(&helper_path.to_string_lossy()),
        uid = uid.trim(),
        gid = gid.trim(),
        home = shell_quote(&home.to_string_lossy()),
    );

    fs::write(&script_path, script).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    let shell_command = format!("/bin/sh {}", shell_quote(&script_path.to_string_lossy()));
    let apple_script = format!(
        "do shell script {} with administrator privileges",
        applescript_quote(&shell_command)
    );
    let output = Command::new("osascript")
        .args(["-e", &apple_script])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;
    let _ = fs::remove_file(&script_path);

    if output.status.success() {
        Ok(())
    } else {
        Err(command_failure("Unable to remove shell capture", &output))
    }
}

fn install_shell_capture_direct(
    helper_source_path: &Path,
    runtime_dir: &Path,
    shell_dir: &Path,
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    integration_content: &str,
) -> Result<(), KivraError> {
    fs::create_dir_all(runtime_dir).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::create_dir_all(shell_dir).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::copy(helper_source_path, helper_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::write(integration_path, integration_content)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    append_zshrc_source_line(zshrc_path, source_line)
}

fn uninstall_shell_capture_direct(
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
) -> Result<(), KivraError> {
    remove_zshrc_source_block(zshrc_path, source_line)?;
    let _ = fs::remove_file(integration_path);
    let _ = fs::remove_file(helper_path);
    Ok(())
}

fn append_zshrc_source_line(zshrc_path: &Path, source_line: &str) -> Result<(), KivraError> {
    let current_content = fs::read_to_string(zshrc_path).unwrap_or_default();

    if current_content.lines().any(|line| line == source_line) {
        return Ok(());
    }

    let block = format!(
        "{}\n# >>> kivra shell capture >>>\n{}\n# <<< kivra shell capture <<<\n",
        current_content.trim_end(),
        source_line
    );

    fs::write(zshrc_path, block).map_err(|error| KivraError::Filesystem(error.to_string()))
}

fn remove_zshrc_source_block(zshrc_path: &Path, source_line: &str) -> Result<(), KivraError> {
    let current_content = fs::read_to_string(zshrc_path).unwrap_or_default();
    let mut next_lines = Vec::new();
    let mut skip_block = false;

    for line in current_content.lines() {
        if line == "# >>> kivra shell capture >>>" {
            skip_block = true;
            continue;
        }

        if line == "# <<< kivra shell capture <<<" {
            skip_block = false;
            continue;
        }

        if !skip_block && line != source_line {
            next_lines.push(line);
        }
    }

    let next_content = if next_lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", next_lines.join("\n"))
    };

    fs::write(zshrc_path, next_content).map_err(|error| KivraError::Filesystem(error.to_string()))
}

fn shell_integration_content(kivra_home: &Path, helper_path: &Path) -> String {
    format!(
        r#"# Kivra automatic shell capture for zsh.
# This file is generated by Kivra.

if [ -n "$KIVRA_SHELL_CAPTURE_LOADED" ]; then
  return
fi

export KIVRA_SHELL_CAPTURE_LOADED=1
export KIVRA_PROJECTS_FILE="{projects_file}"
export KIVRA_STREAM_HELPER="{helper_path}"

autoload -Uz add-zsh-hook

function _kivra_preexec() {{
  if [ -n "$KIVRA_CAPTURE_RUN_DIR" ]; then
    return
  fi

  if [ ! -f "$KIVRA_PROJECTS_FILE" ] || [ ! -f "$KIVRA_STREAM_HELPER" ]; then
    return
  fi

  local run_dir
  run_dir="$(node "$KIVRA_STREAM_HELPER" start "$PWD" "$1" "$KIVRA_PROJECTS_FILE" 2>/dev/null)"

  if [ -z "$run_dir" ]; then
    return
  fi

  export KIVRA_CAPTURE_RUN_DIR="$run_dir"
  exec {{KIVRA_ORIG_STDOUT}}>&1
  exec {{KIVRA_ORIG_STDERR}}>&2
  exec > >(node "$KIVRA_STREAM_HELPER" stream "$KIVRA_CAPTURE_RUN_DIR" stdout)
  exec 2> >(node "$KIVRA_STREAM_HELPER" stream "$KIVRA_CAPTURE_RUN_DIR" stderr >&2)
}}

function _kivra_precmd() {{
  if [ -z "$KIVRA_CAPTURE_RUN_DIR" ]; then
    return
  fi

  exec 1>&$KIVRA_ORIG_STDOUT
  exec 2>&$KIVRA_ORIG_STDERR
  exec {{KIVRA_ORIG_STDOUT}}>&-
  exec {{KIVRA_ORIG_STDERR}}>&-
  unset KIVRA_CAPTURE_RUN_DIR
  unset KIVRA_ORIG_STDOUT
  unset KIVRA_ORIG_STDERR
}}

add-zsh-hook preexec _kivra_preexec
add-zsh-hook precmd _kivra_precmd
"#,
        projects_file = kivra_home.join("trace-projects.json").to_string_lossy(),
        helper_path = helper_path.to_string_lossy(),
    )
}

fn ensure_jetbrains_plugin_zip(repo_root: &Path) -> Result<PathBuf, KivraError> {
    let plugin_dir = repo_root.join("plugins").join("jetbrains");
    let distributions_dir = plugin_dir.join("build").join("distributions");
    let plugin_zip_path = distributions_dir.join("kivra-jetbrains-0.1.0.zip");

    if plugin_zip_path.exists() {
        return Ok(plugin_zip_path);
    }

    let output = Command::new("./gradlew")
        .arg("buildPlugin")
        .current_dir(&plugin_dir)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(KivraError::Command(format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    if plugin_zip_path.exists() {
        Ok(plugin_zip_path)
    } else {
        Err(KivraError::Filesystem(
            "JetBrains plugin ZIP was not created.".to_string(),
        ))
    }
}

fn install_jetbrains_plugin_to_roots(
    plugin_zip_path: &Path,
    plugin_roots: Vec<PathBuf>,
    replace_existing: bool,
) -> Result<Vec<String>, KivraError> {
    let mut installed_paths = Vec::new();

    for plugin_root in plugin_roots {
        fs::create_dir_all(&plugin_root)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;
        let target_path = plugin_root.join(JETBRAINS_PLUGIN_DIRECTORY);

        if target_path.exists() {
            if !replace_existing {
                continue;
            }

            fs::remove_dir_all(&target_path)
                .map_err(|error| KivraError::Filesystem(error.to_string()))?;
        }

        let output = Command::new("unzip")
            .args([
                "-q",
                "-o",
                &plugin_zip_path.to_string_lossy(),
                "-d",
                &plugin_root.to_string_lossy(),
            ])
            .output()
            .map_err(|error| KivraError::Command(error.to_string()))?;

        if !output.status.success() {
            return Err(command_failure(
                "Unable to install JetBrains plugin",
                &output,
            ));
        }

        installed_paths.push(target_path.to_string_lossy().to_string());
    }

    Ok(installed_paths)
}

fn ensure_vscode_extension_vsix(repo_root: &Path) -> Result<PathBuf, KivraError> {
    let plugin_dir = repo_root.join("plugins").join("vscode");
    let vsix_path = plugin_dir.join("build").join("kivra-vscode-0.1.0.vsix");

    if vsix_path.exists() {
        return Ok(vsix_path);
    }

    let output = Command::new("pnpm")
        .args(["--filter", "kivra-vscode", "package"])
        .current_dir(repo_root)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(command_failure(
            "Unable to package VS Code extension",
            &output,
        ));
    }

    if vsix_path.exists() {
        Ok(vsix_path)
    } else {
        Err(KivraError::Filesystem(
            "VS Code extension VSIX was not created.".to_string(),
        ))
    }
}

fn vscode_extension_installed(cli_path: &Path) -> bool {
    let output = Command::new(cli_path)
        .args(["--list-extensions", "--show-versions"])
        .output();

    let Ok(output) = output else {
        return false;
    };

    if !output.status.success() {
        return false;
    }

    String::from_utf8_lossy(&output.stdout).lines().any(|line| {
        line == VSCODE_EXTENSION_ID || line.starts_with(&format!("{VSCODE_EXTENSION_ID}@"))
    })
}

fn vscode_cli_path() -> Option<PathBuf> {
    command_path("code").or_else(|| {
        let macos_path =
            PathBuf::from("/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code");

        macos_path.exists().then_some(macos_path)
    })
}

fn command_path(command: &str) -> Option<PathBuf> {
    let output = Command::new("which").arg(command).output().ok()?;

    if !output.status.success() {
        return None;
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if path.is_empty() {
        None
    } else {
        Some(PathBuf::from(path))
    }
}

fn jetbrains_plugin_roots() -> Result<Vec<JetBrainsPluginRoot>, KivraError> {
    let application_support = home_dir()?.join("Library").join("Application Support");
    let mut plugin_roots = Vec::new();

    collect_jetbrains_plugin_roots(
        &application_support.join("JetBrains"),
        is_jetbrains_config_dir,
        &mut plugin_roots,
    )?;
    collect_jetbrains_plugin_roots(
        &application_support.join("Google"),
        is_android_studio_config_dir,
        &mut plugin_roots,
    )?;

    plugin_roots.sort_by(|left, right| left.path.cmp(&right.path));
    plugin_roots.dedup_by(|left, right| left.path == right.path);

    Ok(plugin_roots
        .into_iter()
        .map(|plugin| JetBrainsPluginRoot {
            display_name: plugin_display_name(&plugin.name),
            plugin_root: plugin.path.join("plugins"),
        })
        .collect())
}

fn missing_jetbrains_plugin_roots() -> Result<Vec<PathBuf>, KivraError> {
    Ok(jetbrains_plugin_roots()?
        .into_iter()
        .map(|path| path.plugin_root)
        .filter(|path| !path.join(JETBRAINS_PLUGIN_DIRECTORY).exists())
        .collect())
}

#[derive(Debug)]
struct JetBrainsConfigPath {
    name: String,
    path: PathBuf,
}

fn collect_jetbrains_plugin_roots(
    root: &Path,
    matcher: fn(&str) -> bool,
    plugin_roots: &mut Vec<JetBrainsConfigPath>,
) -> Result<(), KivraError> {
    if !root.exists() {
        return Ok(());
    }

    plugin_roots.extend(
        fs::read_dir(root)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.is_dir())
            .filter_map(|path| {
                let name = path.file_name().and_then(OsStr::to_str)?.to_string();

                if matcher(&name) {
                    Some(JetBrainsConfigPath { name, path })
                } else {
                    None
                }
            }),
    );

    Ok(())
}

fn jetbrains_plugin_statuses() -> Result<Vec<JetBrainsPluginStatus>, KivraError> {
    Ok(jetbrains_plugin_roots()?
        .into_iter()
        .map(|plugin| {
            let path = plugin.plugin_root.join(JETBRAINS_PLUGIN_DIRECTORY);

            JetBrainsPluginStatus {
                display_name: plugin.display_name,
                installed: path.exists(),
                path: path.to_string_lossy().to_string(),
            }
        })
        .collect())
}

fn is_jetbrains_config_dir(value: &str) -> bool {
    [
        "IntelliJIdea",
        "WebStorm",
        "PyCharm",
        "GoLand",
        "PhpStorm",
        "CLion",
        "RubyMine",
        "DataGrip",
        "Rider",
        "RustRover",
    ]
    .iter()
    .any(|prefix| value.starts_with(prefix))
}

fn is_android_studio_config_dir(value: &str) -> bool {
    value.starts_with("AndroidStudio")
}

fn plugin_display_name(value: &str) -> String {
    let Some((prefix, product)) = [
        ("IntelliJIdea", "IntelliJ IDEA"),
        ("AndroidStudio", "Android Studio"),
        ("WebStorm", "WebStorm"),
        ("PyCharm", "PyCharm"),
        ("GoLand", "GoLand"),
        ("PhpStorm", "PhpStorm"),
        ("CLion", "CLion"),
        ("RubyMine", "RubyMine"),
        ("DataGrip", "DataGrip"),
        ("Rider", "Rider"),
        ("RustRover", "RustRover"),
    ]
    .iter()
    .find(|(prefix, _)| value.starts_with(prefix)) else {
        return value.to_string();
    };

    let version = value.strip_prefix(prefix).unwrap_or_default();

    if version.is_empty() {
        product.to_string()
    } else {
        format!("{product} {version}")
    }
}

fn find_repo_root() -> Option<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(current_dir) = env::current_dir() {
        candidates.push(current_dir);
    }

    if let Ok(current_exe) = env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            candidates.push(parent.to_path_buf());
        }
    }

    for candidate in candidates {
        for ancestor in candidate.ancestors() {
            if ancestor.join("package.json").exists()
                && ancestor
                    .join("tools")
                    .join("kivra-shell-stream.mjs")
                    .exists()
            {
                return Some(ancestor.to_path_buf());
            }
        }
    }

    None
}

fn command_output(command: &str, args: &[&str]) -> Result<String, KivraError> {
    let output = Command::new(command)
        .args(args)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(command_failure(command, &output))
    }
}

fn command_failure(context: &str, output: &std::process::Output) -> KivraError {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let detail = if !stderr.is_empty() {
        stderr
    } else if !stdout.is_empty() {
        stdout
    } else {
        format!(
            "Command exited with status {} without an error message.",
            output.status
        )
    };

    KivraError::Command(format!("{context}: {detail}"))
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn applescript_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn trace_projects_file_path() -> Result<PathBuf, KivraError> {
    Ok(kivra_home_dir()?.join("trace-projects.json"))
}

fn kivra_home_dir() -> Result<PathBuf, KivraError> {
    Ok(home_dir()?.join(KIVRA_HOME_DIRECTORY))
}

fn home_dir() -> Result<PathBuf, KivraError> {
    let home = env::var("HOME")
        .map_err(|error| KivraError::Filesystem(format!("HOME is unavailable: {error}")))?;

    Ok(PathBuf::from(home))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_project,
            read_project_directory,
            open_external_url,
            wait_for_auth_callback,
            exchange_auth_code,
            run_project_command,
            read_project_file,
            read_captured_runs,
            sync_trace_projects,
            start_trace_agent,
            get_integration_status,
            install_shell_capture,
            uninstall_shell_capture,
            install_jetbrains_plugin,
            install_missing_jetbrains_plugins,
            install_vscode_extension
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kivra");
}
