#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig, validateConfig } from "./config.js";
import { buildCommand } from "./cli/build.js";
import { discoverCommand } from "./cli/discover.js";

const program = new Command();

program
  .name("arc")
  .description("Design architectures by learning from real open-source projects")
  .version("0.1.0");

program
  .command("build")
  .description("Search repos, generate diagrams, and open the design canvas")
  .argument("<description>", "description of the project you want to build")
  .action(async (description: string) => {
    const config = loadConfig();
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error("Configuration errors:");
      for (const err of errors) console.error(`  - ${err}`);
      process.exit(1);
    }
    await buildCommand(description, config);
  });

program
  .command("discover")
  .description("Search for architecturally relevant repos without opening the canvas")
  .argument("<description>", "description of the project you want to find repos for")
  .action(async (description: string) => {
    const config = loadConfig();
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error("Configuration errors:");
      for (const err of errors) console.error(`  - ${err}`);
      process.exit(1);
    }
    await discoverCommand(description, config);
  });

program.parse(process.argv);
