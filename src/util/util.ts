import { YAML } from "bun";
import { readdir } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

export const formatString = (s: string, vals: Record<string, string>): string => {
    return s.replaceAll(/\{(\w+)\}/g, (_, k) => vals[k] || `{${k}}`);
};

export const convertToForwardSlashes = (path: string): string => {
    return path.replaceAll("\\", "/");
};


const getFileText = async (file: Bun.BunFile): Promise<string> => {
    try {
        return await file.text();
    } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
    }
};

const writeFileText = async (file: Bun.BunFile, contents: string): Promise<void> => {
    try {
        await Bun.write(file, contents, { createPath: true });
    } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
    }
};

export const readPropertiesFile = async (file: Bun.BunFile): Promise<Record<string, unknown>> => {
    const content = await getFileText(file);
    return YAML.parse(content) as Record<string, unknown>;
};

export const doesDirectoryExist = async (path: string): Promise<boolean> => {
    try {
        await readdir(path);
        return true;
    } catch {
        return false;
    }
};

export const createDirectoryAtPath = async (path: string): Promise<void> => {
    try {
        await mkdir(path, { recursive: true });
    } catch {
        // throw new Error(`Failed to create directory at ${path}: ${error}`);
    }
};

export default {
    formatString,
    writeFileText,
    getFileText,
    readPropertiesFile,
    convertToForwardSlashes,
    doesDirectoryExist,
    createDirectoryAtPath
};
