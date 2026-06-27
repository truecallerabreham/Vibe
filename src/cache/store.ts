import Database from "better-sqlite3";
import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";

const CACHE_DIR = join(homedir(), ".arc", "cache");

function ensureDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    ensureDir();
    db = new Database(join(CACHE_DIR, "arc.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS search_cache (
        key TEXT PRIMARY KEY,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS diagram_cache (
        repo_url TEXT NOT NULL,
        branch_hash TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (repo_url, branch_hash)
      );
      CREATE TABLE IF NOT EXISTS component_cache (
        repo_url TEXT NOT NULL,
        component_name TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (repo_url, component_name)
      );
    `);
  }
  return db;
}

export function getSearchCached(key: string): string | null {
  const row = getDb().prepare("SELECT result FROM search_cache WHERE key = ? AND datetime(created_at) > datetime('now', '-7 days')").get(key) as { result: string } | undefined;
  return row?.result ?? null;
}

export function setSearchCache(key: string, result: string): void {
  getDb().prepare("INSERT OR REPLACE INTO search_cache (key, result, created_at) VALUES (?, ?, datetime('now'))").run(key, result);
}

export function getDiagramCached(repoUrl: string, branchHash: string): string | null {
  const row = getDb().prepare("SELECT result FROM diagram_cache WHERE repo_url = ? AND branch_hash = ?").get(repoUrl, branchHash) as { result: string } | undefined;
  return row?.result ?? null;
}

export function setDiagramCache(repoUrl: string, branchHash: string, result: string): void {
  getDb().prepare("INSERT OR REPLACE INTO diagram_cache (repo_url, branch_hash, result, created_at) VALUES (?, ?, ?, datetime('now'))").run(repoUrl, branchHash, result);
}

export function getComponentCached(repoUrl: string, componentName: string): string | null {
  const row = getDb().prepare("SELECT result FROM component_cache WHERE repo_url = ? AND component_name = ?").get(repoUrl, componentName) as { result: string } | undefined;
  return row?.result ?? null;
}

export function setComponentCache(repoUrl: string, componentName: string, result: string): void {
  getDb().prepare("INSERT OR REPLACE INTO component_cache (repo_url, component_name, result, created_at) VALUES (?, ?, ?, datetime('now'))").run(repoUrl, componentName, result);
}
