import buildInfo from "./build";
import { type Configuration } from "./configuration";

export const HOME_DIR = (buildInfo.platform === "win32" ? process.env.USERPROFILE : process.env.HOME)?.replaceAll("\\", "/") || "";

export const DEFAULT_CONFIG: Configuration = {
    dotfile_repo_path: "{HOME}/dotfiles"
};

export default {
    HOME_DIR,
    DEFAULT_CONFIG
};
