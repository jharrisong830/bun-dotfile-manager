export type SysPlatform = "win32" | "linux" | "darwin";

const buildInfo = {
    platform: PLATFORM,
    version: VERSION,
    buildTime: BUILD_TIME,
    commitHash: COMMIT_HASH
};

export default buildInfo;
