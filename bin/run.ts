import { $ } from "bun";

import argparse from "../src/util/argparse";
import { getVersionNumber } from "./common";

const args = argparse();

const platform = process.platform;
if (!["win32", "linux", "darwin"].includes(platform)) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
}

const version = `DEV-${await getVersionNumber()}`;
const buildTime = new Date().toISOString();
const commitHash = await $`git rev-parse HEAD`.text();

await $`bun --define PLATFORM=\"'${platform}'\" --define VERSION=\"'${version}'\" --define BUILD_TIME=\"'${buildTime}'\" --define COMMIT_HASH=\"'${commitHash.trim()}'\" --define APP_PROPERTIES=\"'src/resources/properties.yaml'\" index.ts ${args}`;
