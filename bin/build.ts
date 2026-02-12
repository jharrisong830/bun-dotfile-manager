import { $ } from "bun";

import { getVersionNumber } from "./common";

const platform = process.platform;
if (platform !== "win32" && platform !== "linux" && platform !== "darwin") {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
}

const TARGET_PLATFORMS: Record<string, Bun.Build.Target> = {
    "win32": "bun-windows-x64",
    "linux": "bun-linux-x64",
    "darwin": "bun-darwin-arm64"
};

const version = await getVersionNumber();
const buildTime = new Date().toISOString();
const commitHash = await $`git rev-parse HEAD`.text();

await Bun.build({
    entrypoints: ["index.ts"],
    compile: {
        outfile: `dist/bdfm_${platform}_${version}${platform === "win32" ? ".exe" : ""}`,
        target: TARGET_PLATFORMS[platform],
        autoloadBunfig: false,
        autoloadDotenv: false,
        windows: {
            title: "Bun DotFile Manager",
            publisher: "jhg.app",
            version: version,
            description: "Command line utility for managing dotfiles across systems"
        }
    },
    define: {
        PLATFORM: `'${platform}'`,
        VERSION: `'${version}'`,
        BUILD_TIME: `'${buildTime}'`,
        COMMIT_HASH: `'${commitHash.trim()}'`
    },
    minify: true,
    sourcemap: "linked"
});
