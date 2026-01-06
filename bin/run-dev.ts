import { $ } from "bun";

import argparse from "../src/util/argparse";
import { getVersionNumber } from "./common";


const args = argparse().join(" ");
console.log(args);

const platform = process.platform;
if (!["win32", "linux", "darwin"].includes(platform)) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
}

const version = await getVersionNumber();
const buildTime = Date.now().toString();
const commitHash = await $`git rev-parse HEAD`.text();

console.log(`Running development version ${version} (${commitHash.trim()}) for platform ${platform}`);

await $`bun --define PLATFORM=\"'${platform}'\" --define VERSION=\"'${version}'\" --define BUILD_TIME=\"'${buildTime}'\" --define COMMIT_HASH=\"'${commitHash.trim()}'\" index.ts ${args}`.nothrow();
