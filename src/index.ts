#!/usr/bin/env node
import { intro, outro, text, select, spinner, cancel, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const THEME_REPO = "https://github.com/Sheyiyuan/astro-theme-kirari";

async function main() {
  console.clear();
  intro(pc.bgCyan(pc.black(" create-kirari ")));

  const projectName = await text({
    message: "What is your project name?",
    placeholder: "my-blog",
    defaultValue: "my-blog",
    validate: (value) => {
      if (value.length === 0) return "Project name is required";
      if (existsSync(resolve(process.cwd(), value))) {
        return `Directory "${value}" already exists`;
      }
      return;
    },
  });

  if (isCancel(projectName)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const packageManager = await select({
    message: "Which package manager do you want to use?",
    options: [
      { value: "pnpm", label: "pnpm", hint: "recommended" },
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
    ],
    initialValue: "pnpm",
  });

  if (isCancel(packageManager)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const s = spinner();
  s.start("Creating your blog project...");

  const targetDir = resolve(process.cwd(), projectName as string);

  try {
    mkdirSync(targetDir, { recursive: true });
    execSync(`git clone --depth 1 ${THEME_REPO} "${targetDir}"`, {
      stdio: "pipe",
    });
    execSync(`rm -rf "${targetDir}/.git"`, { stdio: "pipe" });
    s.stop("Project created successfully!");

    const installDeps = await select({
      message: "Install dependencies?",
      options: [
        { value: "yes", label: "Yes", hint: "recommended" },
        { value: "no", label: "No" },
      ],
      initialValue: "yes",
    });

    if (isCancel(installDeps)) {
      cancel("Operation cancelled");
      return process.exit(0);
    }

    if (installDeps === "yes") {
      s.start(`Installing dependencies with ${packageManager}...`);
      const installCmd =
        packageManager === "npm"
          ? "npm install"
          : packageManager === "yarn"
          ? "yarn"
          : "pnpm install";
      execSync(installCmd, { cwd: targetDir, stdio: "pipe" });
      s.stop("Dependencies installed!");
    }

    const initGit = await select({
      message: "Initialize a git repository?",
      options: [
        { value: "yes", label: "Yes", hint: "recommended" },
        { value: "no", label: "No" },
      ],
      initialValue: "yes",
    });

    if (isCancel(initGit)) {
      cancel("Operation cancelled");
      return process.exit(0);
    }

    if (initGit === "yes") {
      s.start("Initializing git repository...");
      execSync("git init", { cwd: targetDir, stdio: "pipe" });
      execSync("git add -A", { cwd: targetDir, stdio: "pipe" });
      execSync('git commit -m "Initial commit from create-kirari"', {
        cwd: targetDir,
        stdio: "pipe",
      });
      s.stop("Git repository initialized!");
    }

    outro(pc.green(`Your blog "${projectName}" is ready!`));

    console.log("\nNext steps:");
    console.log(`  ${pc.cyan("cd")} ${projectName}`);
    if (installDeps === "no") {
      console.log(`  ${pc.cyan(`${packageManager} install`)}`);
    }
    console.log(`  ${pc.cyan(`${packageManager} dev`)}`);
    console.log("\nHappy blogging!");
  } catch (error) {
    s.stop("Failed to create project");
    console.error(pc.red(`Error: ${error}`));
    process.exit(1);
  }
}

main();