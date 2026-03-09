import { type Configuration } from "./configuration";
import { convertToForwardSlashes } from "./util";

const rawHomeDir = convertToForwardSlashes((PLATFORM === "win32" ? process.env.USERPROFILE : process.env.HOME) ?? "");
if (!rawHomeDir) throw new Error("Could not determine home directory: HOME (or USERPROFILE on Windows) is not set.");
export const HOME_DIR = rawHomeDir;

export const DEFAULT_CONFIG: Configuration = {
    dotfile_repo_path: "{HOME}/dotfiles"
};

export default {
    HOME_DIR,
    DEFAULT_CONFIG
};
