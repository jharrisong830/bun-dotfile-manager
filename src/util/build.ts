export type SysPlatform = "win32" | "linux" | "darwin";

// supplied at buildtime
declare const PLATFORM: SysPlatform;
declare const VERSION: string;
declare const BUILD_TIME: string;
declare const COMMIT_HASH: string;

const buildInfo = {
    platform: PLATFORM,
    version: VERSION,
    buildTime: BUILD_TIME,
    commitHash: COMMIT_HASH
};

export default buildInfo;
