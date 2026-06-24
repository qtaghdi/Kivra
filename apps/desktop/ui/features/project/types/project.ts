export type projectNode = {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: projectNode[];
};

export type projectMetadata = {
  name: string;
  runtime: string;
  framework: string;
  packageManager: string;
  branch: string;
  repositoryUrl: string | null;
};

export type project = {
  id: string;
  name: string;
  path: string;
  runtime: string;
  framework: string;
  packageManager: string;
  branch: string;
  repositoryUrl: string | null;
  createdAt: string;
  tree: projectNode;
};

export type projectFile = {
  path: string;
  content: string;
  size: number;
  truncated: boolean;
};
