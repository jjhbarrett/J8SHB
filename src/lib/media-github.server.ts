import { Buffer } from "node:buffer";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import nodeFs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { Client } from "ssh2";
import { isMediaKey } from "@/lib/media-slots";
import {
  GITHUB_KNOWN_HOSTS,
  revealDeployKey,
} from "@/lib/media-ssh-key.server";

const exec = promisify(execFile);

const OWNER = "jjhbarrett";
const REPO = "J8SHB";
const BRANCH = "main";
const MEDIA_DIR = "public/media";
const INDEX_PATH = `${MEDIA_DIR}/stills.json`;
const LEGACY_INDEX_PATH = `${MEDIA_DIR}/index.json`;
const RAW_INDEX = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${INDEX_PATH}`;
const RAW_LEGACY_INDEX = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${LEGACY_INDEX_PATH}`;
const RAW_FILE = (key: string, t: string) =>
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${MEDIA_DIR}/${key}.jpg?t=${encodeURIComponent(t)}`;
const AUTHOR = { name: "J8 STUDIOS", email: "hello@joshbarrett.co" };
const UA = "j8studios-media";

export type PersistedMedia = {
  key: string;
  bytes: number;
  updatedAt: string;
  url: string;
};

type IndexMap = Record<string, { bytes: number; updatedAt: string }>;

let lock: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let indexCache: { at: number; value: IndexMap } | null = null;

function toList(index: IndexMap): PersistedMedia[] {
  const out: PersistedMedia[] = [];
  for (const [key, row] of Object.entries(index)) {
    if (!isMediaKey(key)) continue;
    out.push({
      key,
      bytes: row.bytes,
      updatedAt: row.updatedAt,
      url: RAW_FILE(key, row.updatedAt),
    });
  }
  return out;
}

async function githubToken(): Promise<string | null> {
  for (const value of [
    process.env.MEDIA_GITHUB_TOKEN,
    process.env.GITHUB_TOKEN,
  ]) {
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

async function githubJson<T>(
  url: string,
  token: string | null,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/vnd.github+json");
  headers.set("user-agent", UA);
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }
  return { ok: response.ok, status: response.status, data };
}

async function fetchJsonMap(url: string): Promise<IndexMap | null> {
  const response = await fetch(`${url}?t=${Date.now()}`, {
    headers: { "user-agent": UA, accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as IndexMap;
}

async function fetchDirIndex(): Promise<IndexMap> {
  const token = await githubToken();
  const result = await githubJson<
    Array<{ name: string; size?: number; sha?: string }>
  >(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEDIA_DIR}?ref=${BRANCH}`,
    token,
  );
  if (!result.ok || !Array.isArray(result.data)) return {};
  const value: IndexMap = {};
  for (const file of result.data) {
    if (!file.name.endsWith(".jpg")) continue;
    const key = file.name.slice(0, -4);
    if (!isMediaKey(key)) continue;
    value[key] = {
      bytes: file.size ?? 0,
      updatedAt: file.sha ?? new Date().toISOString(),
    };
  }
  return value;
}

async function readIndexFromRaw(): Promise<IndexMap> {
  const now = Date.now();
  if (indexCache && now - indexCache.at < 8_000) return indexCache.value;
  const fromStills = await fetchJsonMap(RAW_INDEX);
  const fromLegacy = fromStills ?? (await fetchJsonMap(RAW_LEGACY_INDEX));
  let value = fromStills ?? fromLegacy ?? {};
  if (Object.keys(value).length === 0) {
    try {
      value = { ...value, ...(await fetchDirIndex()) };
    } catch {
      /* keep what we have */
    }
  }
  indexCache = { at: now, value };
  return value;
}

export async function listPersistedMedia(): Promise<PersistedMedia[]> {
  try {
    return toList(await readIndexFromRaw());
  } catch {
    return [];
  }
}

async function putContents(
  token: string,
  filePath: string,
  contentBase64: string,
  message: string,
): Promise<void> {
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const existing = await githubJson<{ sha?: string }>(`${api}?ref=${BRANCH}`, token);
  const body = JSON.stringify({
    message,
    content: contentBase64,
    branch: BRANCH,
    ...(existing.data?.sha ? { sha: existing.data.sha } : {}),
  });
  const put = await githubJson<{ content?: { sha: string } }>(api, token, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
  });
  if (!put.ok) {
    throw new Error("Could not keep that still.");
  }
}

async function deleteContents(
  token: string,
  filePath: string,
  message: string,
): Promise<void> {
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const existing = await githubJson<{ sha?: string }>(`${api}?ref=${BRANCH}`, token);
  if (!existing.data?.sha) return;
  const del = await githubJson(api, token, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      sha: existing.data.sha,
      branch: BRANCH,
    }),
  });
  if (!del.ok && del.status !== 404) {
    throw new Error("Could not restore that still.");
  }
}

async function persistViaApi(
  token: string,
  key: string | null,
  jpegBase64: string | null,
  bytes: number,
): Promise<PersistedMedia | { ok: true; key: string }> {
  const index = { ...(await readIndexFromRaw()) };
  const updatedAt = new Date().toISOString();
  if (key && jpegBase64) {
    await putContents(
      token,
      `${MEDIA_DIR}/${key}.jpg`,
      jpegBase64,
      `media: ${key}`,
    );
    index[key] = { bytes, updatedAt };
  } else if (key) {
    await deleteContents(token, `${MEDIA_DIR}/${key}.jpg`, `media: restore ${key}`);
    delete index[key];
  }
  await putContents(
    token,
    INDEX_PATH,
    Buffer.from(JSON.stringify(index), "utf8").toString("base64"),
    key ? `media index: ${key}` : "media index",
  );
  indexCache = { at: Date.now(), value: index };
  if (key && jpegBase64) {
    return {
      key,
      bytes,
      updatedAt,
      url: RAW_FILE(key, updatedAt),
    };
  }
  return { ok: true as const, key: key ?? "" };
}

function pktWrapService(body: Buffer, service: string): Buffer {
  const header = `# service=${service}\n`;
  const len = (header.length + 4).toString(16).padStart(4, "0");
  return Buffer.concat([
    Buffer.from(len, "ascii"),
    Buffer.from(header, "utf8"),
    Buffer.from("0000", "ascii"),
    body,
  ]);
}

function asyncBody(buf: Buffer): AsyncIterableIterator<Uint8Array> {
  let sent = false;
  return {
    async next() {
      if (sent) return { done: true, value: undefined };
      sent = true;
      return { done: false, value: new Uint8Array(buf) };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

async function concatBody(
  body?: AsyncIterableIterator<Uint8Array>,
): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function sshReceivePack(payload?: Buffer): Promise<Buffer> {
  const key = revealDeployKey();
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const out: Buffer[] = [];
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error("GitHub took too long."));
    }, 45_000);
    conn.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    conn.on("ready", () => {
      conn.exec(`git-receive-pack '${OWNER}/${REPO}.git'`, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          conn.end();
          reject(err);
          return;
        }
        stream.on("data", (d: Buffer) => out.push(d));
        stream.stderr.on("data", () => undefined);
        stream.on("close", () => {
          clearTimeout(timeout);
          conn.end();
          resolve(Buffer.concat(out));
        });
        if (payload && payload.length) {
          let seenFlush = false;
          const probe = () => {
            const buf = Buffer.concat(out);
            if (!seenFlush && buf.includes(Buffer.from("0000", "ascii"))) {
              seenFlush = true;
              stream.write(payload);
              stream.end();
            }
          };
          stream.on("data", probe);
        } else {
          const probe = () => {
            const buf = Buffer.concat(out);
            if (buf.includes(Buffer.from("0000", "ascii"))) {
              stream.end();
            }
          };
          stream.on("data", probe);
        }
      });
    });
    conn.connect({
      host: "github.com",
      username: "git",
      privateKey: key,
      readyTimeout: 12_000,
    });
  });
}

const sshHttp = {
  async request({
    url,
    method = "GET",
    body,
  }: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: AsyncIterableIterator<Uint8Array>;
  }) {
    const service = url.includes("git-upload-pack")
      ? "git-upload-pack"
      : "git-receive-pack";
    if (service === "git-upload-pack") {
      return http.request({ url, method, body });
    }
    if (method === "GET") {
      const ad = await sshReceivePack();
      const wrapped = pktWrapService(ad, service);
      return {
        url,
        method,
        statusCode: 200,
        statusMessage: "OK",
        body: asyncBody(wrapped),
        headers: {
          "content-type": `application/x-${service}-advertisement`,
        },
      };
    }
    const payload = await concatBody(body);
    const result = await sshReceivePack(payload);
    return {
      url,
      method,
      statusCode: 200,
      statusMessage: "OK",
      body: asyncBody(result),
      headers: {
        "content-type": `application/x-${service}-result`,
      },
    };
  },
};

const REPO_DIR = path.join(os.tmpdir(), "j8-media-repo");

async function ensureIsoRepo(): Promise<string> {
  const gitDir = path.join(REPO_DIR, ".git");
  try {
    await fs.access(gitDir);
    await git.pull({
      fs: nodeFs,
      http,
      dir: REPO_DIR,
      author: AUTHOR,
      singleBranch: true,
    });
  } catch {
    await fs.rm(REPO_DIR, { recursive: true, force: true });
    await git.clone({
      fs: nodeFs,
      http,
      dir: REPO_DIR,
      url: `https://github.com/${OWNER}/${REPO}.git`,
      ref: BRANCH,
      singleBranch: true,
      depth: 1,
    });
  }
  return REPO_DIR;
}

async function persistViaGit(
  key: string | null,
  jpeg: Buffer | null,
  bytes: number,
): Promise<PersistedMedia | { ok: true; key: string }> {
  try {
    return await persistViaGitCli(key, jpeg, bytes);
  } catch (cliErr) {
    try {
      return await persistViaIsoGit(key, jpeg, bytes);
    } catch {
      throw cliErr instanceof Error ? cliErr : new Error("Could not keep that still.");
    }
  }
}

async function deployKeyEnv(): Promise<NodeJS.ProcessEnv> {
  const keyFile = path.join(os.tmpdir(), "j8-media-deploy");
  const hosts = path.join(os.tmpdir(), "j8-known-hosts");
  await fs.writeFile(keyFile, revealDeployKey(), { mode: 0o600 });
  await fs.writeFile(hosts, GITHUB_KNOWN_HOSTS);
  const ssh = `ssh -i ${keyFile} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${hosts}`;
  return {
    ...process.env,
    GIT_SSH_COMMAND: ssh,
    GIT_AUTHOR_NAME: AUTHOR.name,
    GIT_AUTHOR_EMAIL: AUTHOR.email,
    GIT_COMMITTER_NAME: AUTHOR.name,
    GIT_COMMITTER_EMAIL: AUTHOR.email,
  };
}

async function persistViaGitCli(
  key: string | null,
  jpeg: Buffer | null,
  bytes: number,
): Promise<PersistedMedia | { ok: true; key: string }> {
  const env = await deployKeyEnv();
  const dir = REPO_DIR;
  try {
    await exec("git", ["-C", dir, "rev-parse", "--is-inside-work-tree"], {
      env,
      timeout: 4_000,
    });
    await exec("git", ["-C", dir, "fetch", "origin", BRANCH], {
      env,
      timeout: 30_000,
    });
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
  return writeCommitPush(dir, env, key, jpeg, bytes, "cli");
}

async function persistViaIsoGit(
  key: string | null,
  jpeg: Buffer | null,
  bytes: number,
): Promise<PersistedMedia | { ok: true; key: string }> {
  const dir = await ensureIsoRepo();
  const env = await deployKeyEnv();
  return writeCommitPush(dir, env, key, jpeg, bytes, "iso");
}

async function writeCommitPush(
  dir: string,
  env: NodeJS.ProcessEnv,
  key: string | null,
  jpeg: Buffer | null,
  bytes: number,
  mode: "cli" | "iso",
): Promise<PersistedMedia | { ok: true; key: string }> {
  const indexFile = path.join(dir, INDEX_PATH);
  let index: IndexMap = {};
  try {
    index = JSON.parse(await fs.readFile(indexFile, "utf8")) as IndexMap;
  } catch {
    index = {};
  }
  const updatedAt = new Date().toISOString();
  if (key && jpeg) {
    const filePath = path.join(dir, MEDIA_DIR, `${key}.jpg`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, jpeg);
    index[key] = { bytes, updatedAt };
  } else if (key) {
    await fs.rm(path.join(dir, MEDIA_DIR, `${key}.jpg`), { force: true });
    delete index[key];
  }
  await fs.mkdir(path.dirname(indexFile), { recursive: true });
  await fs.writeFile(indexFile, `${JSON.stringify(index)}\n`);

  if (mode === "iso") {
    if (key && jpeg) {
      await git.add({ fs: nodeFs, dir, filepath: `${MEDIA_DIR}/${key}.jpg` });
    } else if (key) {
      try {
        await git.remove({
          fs: nodeFs,
          dir,
          filepath: `${MEDIA_DIR}/${key}.jpg`,
        });
      } catch {
        /* already gone */
      }
    }
    await git.add({ fs: nodeFs, dir, filepath: INDEX_PATH });
    await git.commit({
      fs: nodeFs,
      dir,
      author: AUTHOR,
      message: key ? `media: ${key}` : "media",
    });
    try {
      await git.push({
        fs: nodeFs,
        http: sshHttp,
        dir,
        remote: "origin",
        ref: BRANCH,
      });
    } catch {
      await exec("git", ["-C", dir, "push", "origin", BRANCH], {
        timeout: 60_000,
        env,
      });
    }
  } else {
    await exec("git", ["-C", dir, "add", MEDIA_DIR], { env, timeout: 10_000 });
    try {
      await exec(
        "git",
        ["-C", dir, "commit", "-m", key ? `media: ${key}` : "media"],
        { env, timeout: 10_000 },
      );
    } catch {
      /* nothing to commit */
    }
    try {
      await exec("git", ["-C", dir, "push", "origin", BRANCH], {
        env,
        timeout: 60_000,
      });
    } catch {
      await exec("git", ["-C", dir, "pull", "--rebase", "origin", BRANCH], {
        env,
        timeout: 30_000,
      });
      await exec("git", ["-C", dir, "push", "origin", BRANCH], {
        env,
        timeout: 60_000,
      });
    }
  }

  indexCache = { at: Date.now(), value: index };
  if (key && jpeg) {
    return { key, bytes, updatedAt, url: RAW_FILE(key, updatedAt) };
  }
  return { ok: true as const, key: key ?? "" };
}

export async function persistMediaJpeg(
  key: string,
  jpegBase64: string,
  bytes: number,
): Promise<PersistedMedia> {
  return exclusive(async () => {
    const token = await githubToken();
    if (token) {
      try {
        const saved = await persistViaApi(token, key, jpegBase64, bytes);
        if ("url" in saved) return saved;
      } catch {
        /* fall through to git */
      }
    }
    const saved = await persistViaGit(
      key,
      Buffer.from(jpegBase64, "base64"),
      bytes,
    );
    if ("url" in saved) return saved;
    throw new Error("Could not keep that still.");
  });
}

export async function removePersistedMedia(key: string): Promise<void> {
  await exclusive(async () => {
    const token = await githubToken();
    if (token) {
      try {
        await persistViaApi(token, key, null, 0);
        return;
      } catch {
        /* fall through */
      }
    }
    await persistViaGit(key, null, 0);
  });
}
