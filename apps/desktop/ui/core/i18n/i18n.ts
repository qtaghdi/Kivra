import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  en: {
    translation: {
      app: {
        tagline: "Build. Fail. Remember."
      },
      nav: {
        dashboard: "Dashboard",
        login: "GitHub Login",
        runs: "Runs",
        knowledge: "Knowledge",
        localMemory: "Local Memory",
        openProjectFirst: "Open a project first"
      },
      runtime: {
        desktopRequired: "Native actions require the desktop app.",
        desktopRequiredDetail: "The browser preview can render the UI, but cannot scan folders or run commands."
      },
      auth: {
        title: "GitHub Login",
        description: "Sign in with GitHub to sync Kivra memory through Supabase.",
        githubLogin: "Continue with GitHub",
        signedIn: "Signed in with GitHub",
        signOut: "Sign out",
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
      project: {
        addProject: "Add Project",
        browseFolder: "Browse",
        pathPlaceholder: "/Users/name/Projects/app",
        empty: "No projects registered yet.",
        tableProject: "Project",
        runtime: "Runtime",
        framework: "Framework",
        packageManager: "Package Manager",
        branch: "Branch",
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
        settingsMessage: "Project settings will store memory preferences for this project."
      },
      explorer: {
        selectFile: "Select a file to inspect.",
        loadingFile: "Loading file...",
        fileReadFailed: "Unable to read file.",
        truncated: "Large file truncated for inspection."
      },
      runs: {
        command: "Command",
        status: "Status",
        duration: "Duration",
        timestamp: "Timestamp",
        empty: "No command runs captured in this session.",
        run: "Run",
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
        empty: "No detected errors yet."
      },
      notes: {
        placeholder: "Cause, resolution, and reusable debugging notes",
        save: "Save Note",
        selectError: "Select an error to write a resolution note."
      },
      knowledge: {
        searchPlaceholder: "Search error messages, file paths, and notes",
        empty: "No saved knowledge yet.",
        unknownError: "Unknown error"
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
        runs: "실행 기록",
        knowledge: "지식",
        localMemory: "로컬 메모리",
        openProjectFirst: "먼저 프로젝트를 열어주세요"
      },
      runtime: {
        desktopRequired: "네이티브 기능은 데스크톱 앱에서만 동작합니다.",
        desktopRequiredDetail: "브라우저 미리보기는 UI만 렌더링하며 폴더 스캔이나 명령 실행은 할 수 없습니다."
      },
      auth: {
        title: "GitHub 로그인",
        description: "GitHub로 로그인해 Kivra 메모리를 Supabase와 동기화합니다.",
        githubLogin: "GitHub로 계속하기",
        signedIn: "GitHub로 로그인됨",
        signOut: "로그아웃",
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
      project: {
        addProject: "프로젝트 추가",
        browseFolder: "찾기",
        pathPlaceholder: "/Users/name/Projects/app",
        empty: "아직 등록된 프로젝트가 없습니다.",
        tableProject: "프로젝트",
        runtime: "런타임",
        framework: "프레임워크",
        packageManager: "패키지 매니저",
        branch: "브랜치",
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
        settingsMessage: "프로젝트 설정에는 이 프로젝트의 메모리 선호값이 저장됩니다."
      },
      explorer: {
        selectFile: "내용을 보려면 파일을 선택하세요.",
        loadingFile: "파일을 불러오는 중...",
        fileReadFailed: "파일을 읽을 수 없습니다.",
        truncated: "큰 파일이라 일부만 표시합니다."
      },
      runs: {
        command: "명령어",
        status: "상태",
        duration: "소요 시간",
        timestamp: "시간",
        empty: "이 세션에서 캡처한 명령 실행이 없습니다.",
        run: "실행",
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
        empty: "감지된 에러가 없습니다."
      },
      notes: {
        placeholder: "원인, 해결 방법, 재사용할 디버깅 메모",
        save: "노트 저장",
        selectError: "해결 노트를 쓰려면 에러를 선택하세요."
      },
      knowledge: {
        searchPlaceholder: "에러 메시지, 파일 경로, 노트 검색",
        empty: "아직 저장된 지식이 없습니다.",
        unknownError: "알 수 없는 에러"
      }
    }
  }
} as const;

function getInitialLanguage() {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export { i18n };
