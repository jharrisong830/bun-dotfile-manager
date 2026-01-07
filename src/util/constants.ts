import { type Configuration } from "./configuration";
import { convertToForwardSlashes } from "./util";

export const HOME_DIR = convertToForwardSlashes((PLATFORM === "win32" ? process.env.USERPROFILE : process.env.HOME) || "");

export const DEFAULT_CONFIG: Configuration = {
    dotfile_repo_path: "{HOME}/dotfiles"
};

export default {
    HOME_DIR,
    DEFAULT_CONFIG
};
