import buildInfo from "./build";

export const formatString = (s: string, vals: Record<string, string>): string => {
    return s.replaceAll(/\{(\w+)\}/g, (_, k) => vals[k] || `{${k}}`);
};

export const HOME_DIR = (buildInfo.platform === "win32" ? process.env.USERPROFILE : process.env.HOME)?.replaceAll("\\", "/") || "";

export default {
    formatString,
    HOME_DIR
};
