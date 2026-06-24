import { getGithubAccessToken } from "@/features/auth/services/auth-service";
import type {
  project,
  projectFile,
  projectNode
} from "@/features/project/types/project";

export type githubRepository = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
  private: boolean;
  language: string | null;
  updatedAt: string;
};

type githubRepositoryResponse = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  updated_at: string;
};

type githubTreeResponse = {
  tree: Array<{
    path: string;
    type: "blob" | "tree";
  }>;
};

type githubContentResponse = {
  content?: string;
  encoding?: string;
  size: number;
  type: string;
};

async function githubFetch<T>(path: string): Promise<T> {
  const token = await getGithubAccessToken();

  if (!token) {
    throw new Error("GITHUB_TOKEN_REQUIRED");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GITHUB_API_${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchGithubRepositories(): Promise<githubRepository[]> {
  const repos = await githubFetch<githubRepositoryResponse[]>(
    "/user/repos?per_page=50&sort=updated&type=all"
  );

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    defaultBranch: repo.default_branch,
    description: repo.description,
    htmlUrl: repo.html_url,
    private: repo.private,
    language: repo.language,
    updatedAt: repo.updated_at
  }));
}

export async function createGithubProject(repo: githubRepository): Promise<project> {
  const tree = await fetchGithubProjectTree({
    defaultBranch: repo.defaultBranch,
    fullName: repo.fullName,
    name: repo.name
  });
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: repo.name,
    path: repo.fullName,
    runtime: inferRuntime(repo.language),
    framework: "GitHub",
    packageManager: "remote",
    branch: repo.defaultBranch,
    repositoryUrl: repo.htmlUrl,
    createdAt: now,
    source: "github",
    tree
  };
}

export async function hydrateGithubProjectTree(project: project): Promise<project> {
  const repoPath = getRepoPath(project);

  return {
    ...project,
    path: repoPath,
    tree: await fetchGithubProjectTree({
      defaultBranch: project.branch,
      fullName: repoPath,
      name: project.name
    })
  };
}

export async function readGithubProjectFile(args: {
  filePath: string;
  project: project;
}): Promise<projectFile> {
  const repoPath = getRepoPath(args.project);
  const encodedPath = args.filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const content = await githubFetch<githubContentResponse>(
    `/repos/${repoPath}/contents/${encodedPath}?ref=${encodeURIComponent(args.project.branch)}`
  );

  if (content.type !== "file" || content.encoding !== "base64" || !content.content) {
    throw new Error("GITHUB_FILE_UNREADABLE");
  }

  const decoded = decodeBase64Content(content.content);

  return {
    path: args.filePath,
    content: decoded.slice(0, 200_000),
    size: content.size,
    truncated: decoded.length > 200_000
  };
}

async function fetchGithubProjectTree(repo: {
  defaultBranch: string;
  fullName: string;
  name: string;
}): Promise<projectNode> {
  const data = await githubFetch<githubTreeResponse>(
    `/repos/${repo.fullName}/git/trees/${encodeURIComponent(repo.defaultBranch)}?recursive=1`
  );
  const root: projectNode = {
    id: repo.fullName,
    name: repo.name,
    path: repo.fullName,
    type: "folder",
    children: []
  };

  for (const item of data.tree) {
    if (!item.path || item.path.includes(".git/")) {
      continue;
    }

    addTreePath(root, item.path, item.type === "tree" ? "folder" : "file");
  }

  sortTree(root);

  return root;
}

function addTreePath(root: projectNode, path: string, type: "file" | "folder") {
  const parts = path.split("/");
  let current = root;

  for (const [index, part] of parts.entries()) {
    const isLast = index === parts.length - 1;
    const childPath = parts.slice(0, index + 1).join("/");
    const childType = isLast ? type : "folder";
    const existing = current.children?.find((child) => child.name === part);

    if (existing) {
      current = existing;
      continue;
    }

    const nextNode: projectNode = {
      id: childPath,
      name: part,
      path: childPath,
      type: childType,
      children: childType === "folder" ? [] : undefined
    };

    current.children = current.children ?? [];
    current.children.push(nextNode);
    current = nextNode;
  }
}

function sortTree(node: projectNode) {
  node.children?.sort((first, second) => {
    if (first.type !== second.type) {
      return first.type === "folder" ? -1 : 1;
    }

    return first.name.localeCompare(second.name);
  });
  node.children?.forEach(sortTree);
}

function getRepoPath(project: project) {
  if (project.path.includes("/")) {
    return project.path;
  }

  if (!project.repositoryUrl) {
    throw new Error("GITHUB_REPOSITORY_REQUIRED");
  }

  return new URL(project.repositoryUrl).pathname.replace(/^\/|\.git$/g, "");
}

function inferRuntime(language: string | null) {
  if (!language) {
    return "GitHub";
  }

  if (["JavaScript", "TypeScript"].includes(language)) {
    return "Node";
  }

  return language;
}

function decodeBase64Content(content: string) {
  const binary = window.atob(content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
