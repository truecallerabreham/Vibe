import { Config } from "../config.js";
import { discoverRepos } from "../search/index.js";

export async function discoverCommand(description: string, config: Config): Promise<void> {
  console.log(`\n  🔍 Searching for projects matching: "${description}"\n`);

  const repos = await discoverRepos(description, config);

  if (repos.length === 0) {
    console.log("  No relevant repos found. Try a different description.");
    return;
  }

  console.log(`\n  Found ${repos.length} architecturally relevant repos:\n`);
  for (let i = 0; i < repos.length; i++) {
    const r = repos[i];
    console.log(`  ${i + 1}. ${r.fullName}`);
    console.log(`     ${r.htmlUrl}`);
    console.log(`     ⭐ ${r.stars}  |  ${r.language || "?"}  |  ${r.description?.slice(0, 100) || "?"}`);
    console.log();
  }
}
