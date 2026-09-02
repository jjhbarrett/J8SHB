import { Buffer } from "node:buffer";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { GITHUB_KNOWN_HOSTS } from "@/lib/media-ssh-key.server";
import { revealInboxKey } from "@/lib/inbox-ssh-key.server";

const exec = promisify(execFile);
const OWNER = "jjhbarrett";
const REPO = "j8-inbox";
const BRANCH = "main";
const UA = "j8studios-inbox";
const AUTHOR = { name: "J8 STUDIOS", email: "hello@joshbarrett.co" };

let lock: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function githubToken(): Promise<string | null> {
  for (const value of [process.env.MEDIA_GITHUB_TOKEN, process.env.GITHUB_TOKEN]) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  try {
    const token = (await fs.readFile("/tmp/grok/connectors/github.token", "utf8")).trim();
    if (token) return token;
  } catch {
    /* sandbox-only */
  }
  try {
    const { stdout } = await exec("gh", ["auth", "token"], { timeout: 4000 });
    const token = stdout.trim();
    if (token) return token;
  } catch {
    /* vercel has no gh */
  }
  return null;
}

async function githubJson(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number }> {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/vnd.github+json");
  headers.set("user-agent", UA);
  headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers });
  return { ok: response.ok, status: response.status };
}

async function fileViaApi(
  token: string,
  id: string,
  title: string,
  markdown: string,
): Promise<boolean> {
  const issue = await githubJson(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues`,
    token,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, body: markdown }),
    },
  );
  const filePath = `requests/${id}.md`;
  const existing = await githubJson(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`,
    token,
  );
  await githubJson(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
    token,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: `request: ${id}`,
        content: Buffer.from(markdown, "utf8").toString("base64"),
        branch: BRANCH,
      }),
    },
  );
  return issue.ok || existing.status === 200;
}

async function fileViaGit(id: string, markdown: string): Promise<boolean> {
  const keyFile = path.join(os.tmpdir(), "j8-inbox-deploy");
  const hosts = path.join(os.tmpdir(), "j8-known-hosts");
  await fs.writeFile(keyFile, revealInboxKey(), { mode: 0o600 });
  await fs.writeFile(hosts, GITHUB_KNOWN_HOSTS);
  const env = {
    ...process.env,
    GIT_SSH_COMMAND: `ssh -i ${keyFile} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${hosts}`,
    GIT_AUTHOR_NAME: AUTHOR.name,
    GIT_AUTHOR_EMAIL: AUTHOR.email,
    GIT_COMMITTER_NAME: AUTHOR.name,
    GIT_COMMITTER_EMAIL: AUTHOR.email,
  };
  const dir = path.join(os.tmpdir(), "j8-inbox-repo");
  try {
    await exec("git", ["-C", dir, "rev-parse", "--is-inside-work-tree"], {
      env,
      timeout: 4_000,
    });
    await exec("git", ["-C", dir, "fetch", "origin", BRANCH], { env, timeout: 30_000 });
    await exec("git", ["-C", dir, "reset", "--hard", `origin/${BRANCH}`], {
      env,
      timeout: 15_000,
    });
  } catch {
    await fs.rm(dir, { recursive: true, force: true });
    await exec(
      "git",
      ["clone", "--depth", "1", `git@github.com:${OWNER}/${REPO}.git`, dir],
      { env, timeout: 60_000 },
    );
  }
  const filePath = path.join(dir, "requests", `${id}.md`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, markdown);
  await exec("git", ["-C", dir, "add", "requests"], { env, timeout: 10_000 });
  try {
    await exec("git", ["-C", dir, "commit", "-m", `request: ${id}`], {
      env,
      timeout: 10_000,
    });
  } catch {
    return true;
  }
  await exec("git", ["-C", dir, "push", "origin", BRANCH], { env, timeout: 60_000 });
  return true;
}

export async function fileEnquiry(input: {
  id: string;
  title: string;
  body: string;
}): Promise<boolean> {
  const markdown = `# ${input.title}\n\n${input.body}\n`;
  return exclusive(async () => {
    const token = await githubToken();
    if (token) {
      try {
        if (await fileViaApi(token, input.id, input.title, markdown)) return true;
      } catch {
        /* fall through to git */
      }
    }
    try {
      return await fileViaGit(input.id, markdown);
    } catch {
      return false;
    }
  });
}
