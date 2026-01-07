// supplied at buildtime
declare type SysPlatform = "win32" | "linux" | "darwin";

declare const PLATFORM: SysPlatform;
declare const VERSION: string;
declare const BUILD_TIME: string;
declare const COMMIT_HASH: string;
declare const APP_PROPERTIES: string;
