import { Config } from "../config.js";
import { RepoInfo } from "../types.js";
import { getSearchCached, setSearchCache } from "../cache/store.js";
import { generateSearchQueries } from "./query-generator.js";
import { searchGithubRepos } from "./github-search.js";
import { rankRepos } from "./repo-ranker.js";

export async function discoverRepos(description: string, config: Config): Promise<RepoInfo[]> {
  const cacheKey = `search:${description.toLowerCase().trim()}`;

  const cached = getSearchCached(cacheKey);
  if (cached) {
    return JSON.parse(cached) as RepoInfo[];
  }

  const queries = await generateSearchQueries(description, config);
  const allResults = await searchGithubRepos(queries, config);
  const ranked = await rankRepos(allResults, description, config);

  setSearchCache(cacheKey, JSON.stringify(ranked));
  return ranked;
}
