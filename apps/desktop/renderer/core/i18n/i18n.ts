import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  type appLanguage,
  resolveLanguage
} from "@/core/settings/settings-store";

export const resources = {
  en: {
    translation: {
      app: {
        tagline: "Build. Fail. Remember."
      },
      nav: {
        dashboard: "Dashboard",
        login: "GitHub Login",
        currentProject: "Current Project",
        openProjectFirst: "Open a project first",
        selectProject: "Select Project",
        settings: "Settings"
      },
      runtime: {
        desktopRequired: "Native actions require the desktop app.",
        desktopRequiredDetail: "The browser preview can render the UI, but cannot scan folders or run commands."
      },
      auth: {
        title: "GitHub Login",
        description: "Sign in with GitHub to sync Kivra memory through Supabase.",
        contextLabel: "Developer memory starts here",
        heroTitle: "Capture the work your terminal forgets.",
        heroDescription: "Kivra keeps project structure, command runs, errors, and resolution notes tied to your GitHub identity before anything is stored.",
        buildDetail: "Register local projects and run commands from one focused workspace.",
        failDetail: "Keep stdout, stderr, exit codes, and parsed errors together.",
        rememberDetail: "Save fixes and reuse them when the same failure appears again.",
        githubLogin: "Continue with GitHub",
        githubLoginPending: "Opening GitHub...",
        progressTitle: "GitHub login in progress",
        progressPreparing: "Preparing a secure GitHub OAuth request.",
        progressGithub: "Approve the GitHub window when it opens.",
        progressSession: "Kivra will verify your session after the redirect.",
        oauthOnly: "No email or password login. GitHub identity scopes your workspace memory.",
        loading: "Checking GitHub session...",
        redirecting: "Signed in. Opening your dashboard...",
        signedIn: "Signed in with GitHub",
        signOut: "Sign out",
        profile: "GitHub Profile",
        configRequired: "Supabase configuration is required.",
        configRequiredDetail: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/desktop/.env before using GitHub OAuth."
      },
      dashboard: {
        title: "Dashboard",
        description: "Project memory, recent runs, and open errors.",
        projects: "Projects",
        runsToday: "Runs Today",
        openErrors: "Open Errors"
      },
      profile: {
        close: "Close profile",
        language: "Language",
        languageSystem: "System",
        localOnly: "Local-only mode",
        projects: "Projects",
        refreshNow: "Refresh Now",
        syncEnabled: "Cloud sync enabled",
        title: "Profile"
      },
      project: {
        addProject: "Add Project",
        actions: "Actions",
        browseFolder: "Browse",
        deleteConfirm: "Delete {{name}} from Kivra?",
        deleteProject: "Delete Project",
        deleteProjectDetail: "Remove this project from Kivra. Synced runs and notes for this project may also be removed from your cloud memory.",
        pathPlaceholder: "/Users/name/Projects/app",
        localImportTitle: "Local project",
        localImportDetail: "Register a folder on this machine for command runs and file memory.",
        localImportHint: "Choose a folder first, or press Add Project to select and register one.",
        structureUnreadable: "Kivra could not read this project structure.",
        structureUnreadableDetail: "Try another folder or a smaller project root. Generated folders and unsupported file entries may need to be ignored.",
        empty: "No projects registered yet.",
        tableProject: "Project",
        runtime: "Runtime",
        framework: "Framework",
        packageManager: "Package Manager",
        branch: "Branch",
        source: "Source",
        localSource: "Local",
        githubSource: "GitHub",
        loadGithubProjects: "Load GitHub Projects",
        refreshGithubProjects: "Refresh",
        loadingGithubProjects: "Loading GitHub repositories...",
        githubImportTitle: "GitHub repositories",
        githubImportDetail: "Import repositories as remote memory projects.",
        githubImportEmptyTitle: "Bring in remote context",
        githubImportEmptyDetail: "Load your GitHub repositories, search the list, then import the projects you want Kivra to remember.",
        githubSearchPlaceholder: "Search repositories",
        githubSearchEmpty: "No repositories match your search.",
        githubTokenRequired: "GitHub authorization is required. Reconnect GitHub to refresh repository access.",
        githubForbidden: "GitHub denied this request. Reconnect GitHub or check repository access.",
        githubProjectsEmpty: "No GitHub repositories found.",
        githubPrivate: "Private",
        githubReconnect: "Reconnect GitHub",
        githubRepository: "repo",
        githubImport: "Import",
        githubImported: "Imported",
        githubRunDisabled: "Remote GitHub projects can be explored and remembered, but commands run only in local projects.",
        githubRunNeedsLocal: "GitHub imports are remote until you connect a local checkout. Connect a folder to run commands here.",
        connectLocalFolder: "Connect Folder",
        openMemory: "Open Memory",
        githubMemoryTitle: "Remote project memory",
        githubMemoryDetail: "Use this GitHub project for repository notes, branch-aware file review, and searchable knowledge. Connect a local checkout only when you need to run commands.",
        loading: "Loading project...",
        notFound: "Project not found.",
        package: "Package",
        tabs: {
          explorer: "Explorer",
          runs: "Runs",
          errors: "Errors",
          knowledge: "Knowledge",
          settings: "Settings"
        },
        tabDescriptions: {
          explorer: "Browse files and inspect the selected source file.",
          runs: "Run project commands and review captured stdout, stderr, and exit codes.",
          errors: "Review parsed failures from command runs and attach resolution notes.",
          knowledge: "Search saved resolution notes for this project.",
          settings: "Project memory preferences will live here."
        },
        settingsMessage: "Project settings will store memory preferences for this project."
      },
      explorer: {
        selectFile: "Select a file to inspect.",
        loadingFile: "Loading file...",
        fileReadFailed: "Unable to read file.",
        truncated: "Large file truncated for inspection.",
        viewModes: {
          code: "Code",
          nodes: "Nodes",
          preview: "Preview"
        }
      },
      runs: {
        command: "Command",
        status: "Status",
        duration: "Duration",
        timestamp: "Timestamp",
        empty: "No command runs captured in this session.",
        emptyDetail: "Run a command from the command bar above. Failed runs can create errors for the Errors tab.",
        run: "Run",
        running: "Running...",
        output: "Output",
        stdout: "stdout",
        stderr: "stderr",
        exitCode: "Exit Code",
        detectedErrors: "Detected Errors",
        noOutput: "No output captured.",
        selectRun: "Select a run to inspect logs."
      },
      errors: {
        message: "Message",
        filePath: "File Path",
        line: "Line",
        column: "Column",
        status: "Status",
        detail: "Error Detail",
        open: "OPEN",
        resolved: "RESOLVED",
        rawOutput: "Raw output",
        empty: "No detected errors yet.",
        emptyDetail: "Run a command first. When Kivra detects build or runtime errors, they appear here for review."
      },
      notes: {
        placeholder: "Cause, resolution, and reusable debugging notes",
        projectMemo: "Project memo",
        projectMemoDetail: "Capture repository context, review notes, and decisions for this project.",
        projectMemoPlaceholder: "Repository context, decisions, TODOs, links, and review notes",
        save: "Save Note",
        selectError: "Select an error to write a resolution note."
      },
      knowledge: {
        searchPlaceholder: "Search error messages, file paths, and notes",
        empty: "No saved knowledge yet.",
        emptyDetail: "Save a resolution note from the Errors tab. It will become searchable here.",
        projectWide: "project-wide",
        unknownError: "Unknown error"
      },
      settings: {
        title: "Settings",
        description: "Install local capture integrations and manage how Kivra receives logs from tools outside the app.",
        installed: "Installed",
        partiallyInstalled: "Partially installed",
        notInstalled: "Not installed",
        installing: "Installing...",
        errorFallback: "The action failed, but no detailed error was returned.",
        shell: {
          title: "zsh shell capture",
          description: "Capture stdout and stderr from registered projects when commands run in Terminal, iTerm, or an IDE terminal.",
          install: "Install shell capture",
          reinstall: "Reinstall shell capture",
          uninstall: "Remove shell capture",
          installSuccess: "Shell capture installed. Open a new terminal to activate it.",
          uninstallSuccess: "Shell capture removed. Open a new terminal to finish deactivating it.",
          permissionTitle: "Administrator permission",
          permissionDetail: "Kivra will ask macOS for administrator permission, install the shell helper under your home directory, update .zshrc, then restore file ownership to your user. Open a new terminal after installation."
        },
        jetbrains: {
          title: "JetBrains Run/Debug plugin",
          description: "Capture Run and Debug console output from IntelliJ IDEA, WebStorm, PyCharm, GoLand, Android Studio, and other JetBrains IDEs.",
          ready: "Ready",
          needsAttention: "Needs attention",
          notLinked: "Not linked",
          linked: "Linked",
          missing: "Missing",
          emptyDetected: "No JetBrains IDE or Android Studio settings folders were detected.",
          install: "Install JetBrains plugin",
          reinstall: "Reinstall JetBrains plugin",
          installMissing: "Install missing IDEs only",
          installSuccess: "JetBrains plugin installed. Restart your JetBrains IDE to load it.",
          installMissingSuccess: "JetBrains plugin installed into missing IDEs. Restart those IDEs to load it.",
          noMissingSuccess: "All detected JetBrains IDEs already have the plugin installed.",
          installedPaths: "Installed",
          missingPaths: "Missing",
          restartTitle: "IDE restart required",
          restartDetail: "Kivra installs the plugin into detected JetBrains IDE plugin folders. Restart the IDE after installation so Run/Debug capture can load."
        },
        vscode: {
          title: "VS Code Run/Debug extension",
          description: "Capture Debug Console output from Visual Studio Code Run and Debug sessions. Integrated terminal commands are still handled by zsh capture.",
          ready: "Ready",
          notLinked: "Not linked",
          cliMissing: "CLI missing",
          install: "Install VS Code extension",
          reinstall: "Reinstall VS Code extension",
          installSuccess: "VS Code extension installed. Restart or reload VS Code to activate it.",
          restartTitle: "VS Code reload required",
          restartDetail: "Kivra installs a local VSIX through the code CLI. Reload VS Code after installation so Run/Debug capture can load."
        }
      }
    }
  },
  ko: {
    translation: {
      app: {
        tagline: "Build. Fail. Remember."
      },
      nav: {
        dashboard: "대시보드",
        login: "GitHub 로그인",
        currentProject: "현재 프로젝트",
        openProjectFirst: "먼저 프로젝트를 열어주세요",
        selectProject: "프로젝트 선택",
        settings: "설정"
      },
      runtime: {
        desktopRequired: "네이티브 기능은 데스크톱 앱에서만 동작합니다.",
        desktopRequiredDetail: "브라우저 미리보기는 UI만 렌더링하며 폴더 스캔이나 명령 실행은 할 수 없습니다."
      },
      auth: {
        title: "GitHub 로그인",
        description: "GitHub로 로그인해 Kivra 메모리를 Supabase와 동기화합니다.",
        contextLabel: "개발자 메모리는 여기서 시작됩니다",
        heroTitle: "터미널이 잊는 작업을 Kivra가 기억합니다.",
        heroDescription: "Kivra는 프로젝트 구조, 명령 실행, 에러, 해결 노트를 GitHub 계정 기준으로 안전하게 저장합니다.",
        buildDetail: "로컬 프로젝트를 등록하고 한 작업 공간에서 명령을 실행합니다.",
        failDetail: "stdout, stderr, exit code, 파싱된 에러를 함께 보관합니다.",
        rememberDetail: "해결 방법을 저장하고 같은 실패가 다시 나타날 때 재사용합니다.",
        githubLogin: "GitHub로 계속하기",
        githubLoginPending: "GitHub를 여는 중...",
        progressTitle: "GitHub 로그인 진행 중",
        progressPreparing: "안전한 GitHub OAuth 요청을 준비합니다.",
        progressGithub: "GitHub 창이 열리면 승인을 완료하세요.",
        progressSession: "리다이렉트 후 Kivra가 세션을 확인합니다.",
        oauthOnly: "이메일/비밀번호 로그인 없이 GitHub 계정으로 작업 메모리를 구분합니다.",
        loading: "GitHub 세션을 확인하는 중...",
        redirecting: "로그인되었습니다. 대시보드로 이동합니다...",
        signedIn: "GitHub로 로그인됨",
        signOut: "로그아웃",
        profile: "GitHub 프로필",
        configRequired: "Supabase 설정이 필요합니다.",
        configRequiredDetail: "GitHub OAuth를 사용하려면 apps/desktop/.env에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요."
      },
      dashboard: {
        title: "대시보드",
        description: "프로젝트 메모리, 최근 실행, 열린 에러를 확인합니다.",
        projects: "프로젝트",
        runsToday: "오늘 실행",
        openErrors: "열린 에러"
      },
      profile: {
        close: "프로필 닫기",
        language: "언어",
        languageSystem: "시스템",
        localOnly: "로컬 전용 모드",
        projects: "프로젝트",
        refreshNow: "지금 새로고침",
        syncEnabled: "클라우드 동기화 켜짐",
        title: "프로필"
      },
      project: {
        addProject: "프로젝트 추가",
        actions: "작업",
        browseFolder: "찾기",
        deleteConfirm: "{{name}} 프로젝트를 Kivra에서 삭제할까요?",
        deleteProject: "프로젝트 삭제",
        deleteProjectDetail: "이 프로젝트를 Kivra에서 제거합니다. 동기화된 실행 기록과 노트도 클라우드 메모리에서 함께 삭제될 수 있습니다.",
        pathPlaceholder: "/Users/name/Projects/app",
        localImportTitle: "로컬 프로젝트",
        localImportDetail: "이 기기의 폴더를 등록해 명령 실행과 파일 메모리를 저장합니다.",
        localImportHint: "먼저 폴더를 고르거나, 프로젝트 추가를 눌러 선택과 등록을 한 번에 진행하세요.",
        structureUnreadable: "Kivra가 이 프로젝트 구조를 읽지 못했습니다.",
        structureUnreadableDetail: "다른 폴더나 더 작은 프로젝트 루트를 선택해보세요. 생성 파일 폴더나 지원하지 않는 파일 항목을 제외해야 할 수 있습니다.",
        empty: "아직 등록된 프로젝트가 없습니다.",
        tableProject: "프로젝트",
        runtime: "런타임",
        framework: "프레임워크",
        packageManager: "패키지 매니저",
        branch: "브랜치",
        source: "소스",
        localSource: "로컬",
        githubSource: "GitHub",
        loadGithubProjects: "GitHub 프로젝트 불러오기",
        refreshGithubProjects: "새로고침",
        loadingGithubProjects: "GitHub 저장소를 불러오는 중...",
        githubImportTitle: "GitHub 저장소",
        githubImportDetail: "저장소를 원격 메모리 프로젝트로 등록합니다.",
        githubImportEmptyTitle: "원격 맥락 가져오기",
        githubImportEmptyDetail: "GitHub 저장소를 불러온 뒤 검색하고, Kivra가 기억할 프로젝트를 선택해 등록하세요.",
        githubSearchPlaceholder: "저장소 검색",
        githubSearchEmpty: "검색 조건에 맞는 저장소가 없습니다.",
        githubTokenRequired: "GitHub 권한이 필요합니다. 저장소 접근 권한을 갱신하려면 GitHub를 다시 연결하세요.",
        githubForbidden: "GitHub가 요청을 거부했습니다. GitHub를 다시 연결하거나 저장소 접근 권한을 확인하세요.",
        githubProjectsEmpty: "불러올 GitHub 저장소가 없습니다.",
        githubPrivate: "비공개",
        githubReconnect: "GitHub 다시 연결",
        githubRepository: "repo",
        githubImport: "가져오기",
        githubImported: "등록됨",
        githubRunDisabled: "GitHub 원격 프로젝트는 탐색과 메모리 저장은 가능하지만, 명령 실행은 로컬 프로젝트에서만 가능합니다.",
        githubRunNeedsLocal: "GitHub에서 가져온 프로젝트는 로컬 체크아웃을 연결하면 명령 실행이 가능합니다.",
        connectLocalFolder: "로컬 폴더 연결",
        openMemory: "메모 열기",
        githubMemoryTitle: "원격 프로젝트 메모리",
        githubMemoryDetail: "이 GitHub 프로젝트에서 저장소 메모, 브랜치별 파일 리뷰, 검색 가능한 지식을 관리하세요. 명령 실행이 필요할 때만 로컬 체크아웃을 연결하면 됩니다.",
        loading: "프로젝트를 불러오는 중...",
        notFound: "프로젝트를 찾을 수 없습니다.",
        package: "패키지",
        tabs: {
          explorer: "탐색기",
          runs: "실행",
          errors: "에러",
          knowledge: "지식",
          settings: "설정"
        },
        tabDescriptions: {
          explorer: "파일을 탐색하고 선택한 소스 파일을 확인합니다.",
          runs: "프로젝트 명령을 실행하고 stdout, stderr, exit code를 확인합니다.",
          errors: "명령 실행에서 감지된 실패를 검토하고 해결 노트를 붙입니다.",
          knowledge: "이 프로젝트에 저장한 해결 노트를 검색합니다.",
          settings: "프로젝트 메모리 설정이 여기에 들어갑니다."
        },
        settingsMessage: "프로젝트 설정에는 이 프로젝트의 메모리 선호값이 저장됩니다."
      },
      explorer: {
        selectFile: "내용을 보려면 파일을 선택하세요.",
        loadingFile: "파일을 불러오는 중...",
        fileReadFailed: "파일을 읽을 수 없습니다.",
        truncated: "큰 파일이라 일부만 표시합니다.",
        viewModes: {
          code: "코드",
          nodes: "노드",
          preview: "프리뷰"
        }
      },
      runs: {
        command: "명령어",
        status: "상태",
        duration: "소요 시간",
        timestamp: "시간",
        empty: "이 세션에서 캡처한 명령 실행이 없습니다.",
        emptyDetail: "위 명령 입력창에서 먼저 실행하세요. 실패한 실행은 에러 탭의 항목으로 이어질 수 있습니다.",
        run: "실행",
        running: "실행 중...",
        output: "출력",
        stdout: "stdout",
        stderr: "stderr",
        exitCode: "종료 코드",
        detectedErrors: "감지된 에러",
        noOutput: "캡처된 출력이 없습니다.",
        selectRun: "로그를 보려면 실행 기록을 선택하세요."
      },
      errors: {
        message: "메시지",
        filePath: "파일 경로",
        line: "라인",
        column: "컬럼",
        status: "상태",
        detail: "에러 상세",
        open: "열림",
        resolved: "해결됨",
        rawOutput: "원본 출력",
        empty: "감지된 에러가 없습니다.",
        emptyDetail: "먼저 명령을 실행하세요. Kivra가 빌드나 런타임 에러를 감지하면 여기에 표시합니다."
      },
      notes: {
        placeholder: "원인, 해결 방법, 재사용할 디버깅 메모",
        projectMemo: "프로젝트 메모",
        projectMemoDetail: "이 프로젝트의 저장소 맥락, 리뷰 메모, 결정 사항을 저장합니다.",
        projectMemoPlaceholder: "저장소 맥락, 결정 사항, TODO, 링크, 리뷰 메모",
        save: "노트 저장",
        selectError: "해결 노트를 쓰려면 에러를 선택하세요."
      },
      knowledge: {
        searchPlaceholder: "에러 메시지, 파일 경로, 노트 검색",
        empty: "아직 저장된 지식이 없습니다.",
        emptyDetail: "에러 탭에서 해결 노트를 저장하면 여기에서 검색할 수 있습니다.",
        projectWide: "프로젝트 전체",
        unknownError: "알 수 없는 에러"
      },
      settings: {
        title: "설정",
        description: "앱 밖에서 실행되는 도구의 로그를 Kivra가 받을 수 있도록 로컬 캡처 연동을 설치합니다.",
        installed: "설치됨",
        partiallyInstalled: "일부 설치됨",
        notInstalled: "설치 안 됨",
        installing: "설치 중...",
        errorFallback: "작업이 실패했지만 자세한 오류 메시지가 반환되지 않았습니다.",
        shell: {
          title: "zsh 쉘 캡처",
          description: "Terminal, iTerm, IDE 터미널에서 등록된 프로젝트 명령이 실행될 때 stdout과 stderr를 캡처합니다.",
          install: "쉘 캡처 설치",
          reinstall: "쉘 캡처 재설치",
          uninstall: "쉘 캡처 삭제",
          installSuccess: "쉘 캡처가 설치되었습니다. 새 터미널을 열면 적용됩니다.",
          uninstallSuccess: "쉘 캡처가 삭제되었습니다. 새 터미널을 열면 비활성화가 완료됩니다.",
          permissionTitle: "관리자 권한 요청",
          permissionDetail: "Kivra가 macOS 관리자 권한을 요청한 뒤 홈 디렉터리에 쉘 헬퍼를 설치하고 .zshrc를 갱신합니다. 설치 후 파일 소유권은 다시 현재 사용자로 맞추며, 새 터미널을 열어야 적용됩니다."
        },
        jetbrains: {
          title: "JetBrains Run/Debug 플러그인",
          description: "IntelliJ IDEA, WebStorm, PyCharm, GoLand, Android Studio 등 JetBrains IDE의 Run/Debug 콘솔 출력을 캡처합니다.",
          ready: "준비됨",
          needsAttention: "확인 필요",
          notLinked: "미연동",
          linked: "연동됨",
          missing: "누락",
          emptyDetected: "JetBrains IDE 또는 Android Studio 설정 폴더를 찾지 못했습니다.",
          install: "JetBrains 플러그인 설치",
          reinstall: "JetBrains 플러그인 재설치",
          installMissing: "누락된 IDE에만 설치",
          installSuccess: "JetBrains 플러그인이 설치되었습니다. IDE를 재시작하면 적용됩니다.",
          installMissingSuccess: "누락된 IDE에 JetBrains 플러그인을 설치했습니다. 해당 IDE를 재시작하면 적용됩니다.",
          noMissingSuccess: "감지된 모든 JetBrains IDE에 이미 플러그인이 설치되어 있습니다.",
          installedPaths: "설치됨",
          missingPaths: "누락됨",
          restartTitle: "IDE 재시작 필요",
          restartDetail: "Kivra가 감지된 JetBrains IDE 플러그인 폴더에 플러그인을 설치합니다. 적용하려면 IDE를 재시작하세요."
        },
        vscode: {
          title: "VS Code Run/Debug 확장",
          description: "Visual Studio Code Run/Debug 세션의 Debug Console 출력을 캡처합니다. 내장 터미널 명령은 기존 zsh 캡처가 처리합니다.",
          ready: "준비됨",
          notLinked: "미연동",
          cliMissing: "CLI 없음",
          install: "VS Code 확장 설치",
          reinstall: "VS Code 확장 재설치",
          installSuccess: "VS Code 확장이 설치되었습니다. VS Code를 재시작하거나 창을 다시 로드하면 적용됩니다.",
          restartTitle: "VS Code 재로드 필요",
          restartDetail: "Kivra가 code CLI로 로컬 VSIX를 설치합니다. 설치 후 VS Code를 재로드해야 Run/Debug 캡처가 동작합니다."
        }
      }
    }
  }
} as const;

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return resolveLanguage("system");
  }

  try {
    const storedSettings = JSON.parse(
      window.localStorage.getItem("kivra.settings") ?? "{}"
    ) as { state?: { language?: appLanguage } };

    return resolveLanguage(storedSettings.state?.language ?? "system");
  } catch {
    return resolveLanguage("system");
  }
};

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export { i18n };
