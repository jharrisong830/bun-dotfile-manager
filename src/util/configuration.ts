import { YAML } from "bun";

import buildInfo from "./build";
import { formatString } from "./util";
import files from "../fs/files";

type Configuration = {
    dotfile_repo_path: string;
};

const PLATFORM_PATHS = {
    win32: "{HOME}/AppData/Local/bun-dotfile-manager/config.yaml",
    linux: "{HOME}/.config/bun-dotfile-manager/config.yaml",
    darwin: "{HOME}/.config/bun-dotfile-manager/config.yaml"
};

const HOME_DIR = (buildInfo.platform === "win32" ? process.env.USERPROFILE : process.env.HOME)?.replaceAll("\\", "/") || "";

const DEFAULT_CONFIG: Configuration = {
    dotfile_repo_path: "{HOME}/dotfiles"
};


const configObjToYAML = (config: Configuration): string => {
    return YAML.stringify(config, null, 4);
};

const YAMLStringToConfigObj = (yamlString: string): Configuration => {
    const obj = YAML.parse(yamlString) as Record<string, unknown>;
    
    if (!Object.keys(obj).includes("dotfile_repo_path")) {
        throw new Error("Invalid configuration file: missing 'dotfile_repo_path' key");
    } 
    if (typeof obj["dotfile_repo_path"] !== "string") {
        throw new Error("Invalid configuration file: 'dotfile_repo_path' must be a string");
    }
    if (Object.keys(obj).length !== 1) {
        throw new Error("Invalid configuration file: unexpected keys present");
    }

    return obj as Configuration;
};

/**
 * returns whether the configuration file exists
 * @returns promise that resolves to a boolean, indicating if the config file exists or not
 */
const doesConfigExist = async (): Promise<boolean> => {
    const path = formatString(PLATFORM_PATHS[buildInfo.platform], { HOME: HOME_DIR });
    const file = Bun.file(path);
    return await file.exists();
};

/**
 * (re)initializes the config file with default values
 */
const initializeConfigFile = async (): Promise<void> => {
    const path = formatString(PLATFORM_PATHS[buildInfo.platform], { HOME: HOME_DIR });
    const file = Bun.file(path);

    const defaultConfigContents = configObjToYAML(DEFAULT_CONFIG);
    await files.writeFileText(file, defaultConfigContents);
}

/**
 * reads the configuration file and resolves any templated values (such as "{HOME}")
 * @returns promise that resolves to a Configuration object
 * @throws if the file cannot be read or parsed
 */
const readAndFormatConfig = async (): Promise<Configuration> => {
    const path = formatString(PLATFORM_PATHS[buildInfo.platform], { HOME: HOME_DIR });
    const file = Bun.file(path);
    
    try {
        const fileContents = await files.getFileText(file); 
        const formattedContents = formatString(fileContents, { HOME: HOME_DIR });
        
        const configObj = YAMLStringToConfigObj(formattedContents);
        return configObj;
    } catch (error) {
        throw new Error(`Failed to read or parse configuration file at ${path}: ${error}`);
    }
};

const setAndFormatConfig = async (dotfileRepoPath: string): Promise<void> => {
    const path = formatString(PLATFORM_PATHS[buildInfo.platform], { HOME: HOME_DIR });
    const file = Bun.file(path);

    try {
        let config = await readAndFormatConfig();
        config.dotfile_repo_path = formatString(dotfileRepoPath, { HOME: HOME_DIR });

        const newConfigContents = configObjToYAML(config);
        await files.writeFileText(file, newConfigContents);
    } catch (error) {
        throw new Error(`Failed to set configuration file at ${path}: ${error}`);
    }
}

export default {
    readAndFormatConfig,
    doesConfigExist,
    initializeConfigFile,
    setAndFormatConfig
};
