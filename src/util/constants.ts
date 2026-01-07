import buildInfo from "./build";
import { type Configuration } from "./configuration";

export const HOME_DIR = (buildInfo.platform === "win32" ? process.env.USERPROFILE : process.env.HOME)?.replaceAll("\\", "/") || "";

export const PLATFORM_PATHS = {
    win32: "{HOME}/AppData/Local/bun-dotfile-manager/config.yaml",
    linux: "{HOME}/.config/bun-dotfile-manager/config.yaml",
    darwin: "{HOME}/.config/bun-dotfile-manager/config.yaml"
};


export const DEFAULT_CONFIG: Configuration = {
    dotfile_repo_path: "{HOME}/dotfiles"
};

export default {
    HOME_DIR,
    PLATFORM_PATHS,
    DEFAULT_CONFIG
};