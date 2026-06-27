import { execSync } from "child_process";

export function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === "win32") {
      execSync(`start "" "${url}"`, { timeout: 3000 });
    } else if (platform === "darwin") {
      execSync(`open "${url}"`, { timeout: 3000 });
    } else {
      execSync(`xdg-open "${url}"`, { timeout: 3000 });
    }
  } catch {
    console.log(`  Open ${url} in your browser to see the design canvas.`);
  }
}
