use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    ffi::OsStr,
    fs,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    path::{Path, PathBuf},
    process::Command,
    time::{Duration, Instant},
};
use thiserror::Error;

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
struct ProjectFile {
    path: String,
    content: String,
    size: u64,
    truncated: bool,
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
        "<title>Kivra authentication complete</title>",
        "<style>",
        "body{margin:0;min-height:100vh;display:grid;place-items:center;",
        "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;",
        "background:#0f172a;color:#e5e7eb}",
        "main{max-width:420px;padding:32px;text-align:center}",
        "h1{font-size:22px;margin:0 0 12px}",
        "p{font-size:14px;line-height:1.6;color:#aeb8c8;margin:0}",
        "</style></head><body><main>",
        "<h1>Authentication complete</h1>",
        "<p>You can return to Kivra now. This tab can be closed.</p>",
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
            read_project_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kivra");
}
