import { YAML } from "bun";

import util from "./util";
import { HOME_DIR, DEFAULT_CONFIG } from "./constants";

export type Configuration = {
    dotfile_repo_path: string;
};


const configObjToYAML = (config: Configuration): string => {
    return YAML.stringify(config, null, 4);
};

const YAMLStringToConfigObj = (yamlString: string): Configuration => {
    const obj = YAML.parse(yamlString) as Record<string, unknown>;
    
    if (obj === null || typeof obj !== "object") {
        throw new Error("Invalid configuration file: not a valid YAML object");
    }
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
const doesConfigExist = async (configPath: string): Promise<boolean> => {
    const file = Bun.file(configPath);
    return await file.exists();
};

/**
 * (re)initializes the config file with default values
 */
const initializeConfigFile = async (configPath: string): Promise<void> => {
    const file = Bun.file(configPath);

    const defaultConfigContents = configObjToYAML(DEFAULT_CONFIG);
    await util.writeFileText(file, defaultConfigContents);
};

/**
 * reads the configuration file and resolves any templated values (such as "{HOME}")
 * @returns promise that resolves to a Configuration object
 * @throws if the file cannot be read or parsed
 */
const readAndFormatConfig = async (configPath: string): Promise<Configuration> => {
    const file = Bun.file(configPath);
    
    try {
        const fileContents = await util.getFileText(file); 
        const formattedContents = util.formatString(fileContents, { HOME: HOME_DIR });
        
        const configObj = YAMLStringToConfigObj(formattedContents);
        return configObj;
    } catch (error) {
        throw new Error(`Failed to read or parse configuration file at ${configPath}: ${error}`);
    }
};

const setConfig = async (configPath: string, dotfileRepoPath: string): Promise<void> => {
    const file = Bun.file(configPath);

    const config: Configuration = {
        dotfile_repo_path: dotfileRepoPath
    };

    try {
        const newConfigContents = configObjToYAML(config);
        await util.writeFileText(file, newConfigContents);
    } catch (error) {
        throw new Error(`Failed to set configuration file at ${configPath}: ${error}`);
    }
}

export default {
    readAndFormatConfig,
    doesConfigExist,
    initializeConfigFile,
    setConfig,
    configObjToYAML,
    YAMLStringToConfigObj
};
