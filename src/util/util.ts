import { YAML } from "bun";
import { readdir } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

export const formatString = (s: string, vals: Record<string, string>): string => {
    return s.replaceAll(/\{(\w+)\}/g, (_, k) => vals[k] || `{${k}}`);
};

export const convertToForwardSlashes = (path: string): string => {
    return path.replaceAll("\\", "/");
};


export const getFileText = async (file: Bun.BunFile): Promise<string> => {
    return await file.text();
};

export const writeFileText = async (file: Bun.BunFile, contents: string): Promise<void> => {
    await Bun.write(file, contents, { createPath: true });
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
    await mkdir(path, { recursive: true });
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
