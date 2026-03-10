import { expect, test, describe, afterAll } from "bun:test";
import { rm } from "node:fs/promises";

import "../resources/global-setup";

import configuration, { type Configuration } from "../../src/util/configuration";

const configPath = `${import.meta.dir}/../resources/config.yaml`;
const TMP = `${import.meta.dir}/../../tmp/configuration-tests`;

afterAll(async () => {
    await rm(TMP, { recursive: true, force: true });
});

const valid_config_object: Configuration = {
    dotfile_repo_path: "/home/testuser/dotfiles"
};
const valid_config_yaml = "dotfile_repo_path: /home/testuser/dotfiles";


describe("configObjToYAML", () => {
    test("configObjToYAML passes", () => {
        const res = configuration.configObjToYAML(valid_config_object);
        expect(res.trim()).toBe(valid_config_yaml);
    });
});

describe("YAMLStringToConfigObj", () => {
    test("YAMLStringToConfigObj valid contents", () => {
        const res = configuration.YAMLStringToConfigObj(valid_config_yaml);
        expect(res).toEqual(valid_config_object);
    });

    test("YAMLStringToConfigObj missing key", () => {
        expect(() => configuration.YAMLStringToConfigObj("")).toThrow();
    });

    test("YAMLStringToConfigObj wrong type", () => {
        expect(() => configuration.YAMLStringToConfigObj("dotfile_repo_path: 123")).toThrow();
    });

    test("YAMLStringToConfigObj extra keys", () => {
        expect(() => configuration.YAMLStringToConfigObj("dotfile_repo_path: /home/testuser/dotfiles\nextra_key: value")).toThrow();
    });

    test("YAMLStringToConfigObj different key", () => {
        expect(() => configuration.YAMLStringToConfigObj("different_key: /home/testuser/dotfiles")).toThrow();
    });

    test("YAMLStringToConfigObj invalid YAML", () => {
        expect(() => configuration.YAMLStringToConfigObj(":::")).toThrow();
    });
});

describe("doesConfigExist", () => {
    test("doesConfigExist file exists", async () => {
        const res = await configuration.doesConfigExist(configPath);
        expect(res).toBe(true);
    });

    test("doesConfigExist file not exists", async () => {
        const res = await configuration.doesConfigExist(`${import.meta.dir}/../resources/dne.yaml`);
        expect(res).toBe(false);
    });
});

describe("readAndFormatConfig", () => {
    test("readAndFormatConfig file exists", async () => {
        const res = await configuration.readAndFormatConfig(configPath);
        const expected: Configuration = {
            dotfile_repo_path: "/home/testuser/dotfiles"
        };
        expect(res).toEqual(expected);
    });

    test("readAndFormatConfig file not exists", async () => {
        await expect(configuration.readAndFormatConfig(`${import.meta.dir}/../resources/dne.yaml`)).rejects.toThrow();
    });

    test("readAndFormatConfig invalid contents", async () => {
        const invalidContentsPath = `${import.meta.dir}/../resources/global-setup.ts`;
        await expect(configuration.readAndFormatConfig(invalidContentsPath)).rejects.toThrow();
    });
});

describe("initializeConfigFile", () => {
    test("writes a valid default config to a new path", async () => {
        const path = `${TMP}/config.yaml`;
        await configuration.initializeConfigFile(path);

        const result = await configuration.readAndFormatConfig(path);
        expect(result.dotfile_repo_path).toBeTruthy();
    });
});

describe("setConfig", () => {
    test("writes the given path to the config file", async () => {
        const path = `${TMP}/set-config.yaml`;
        const newRepoPath = "/home/testuser/my-dotfiles";

        await configuration.setConfig(path, newRepoPath);

        const result = await configuration.readAndFormatConfig(path);
        expect(result).toEqual({ dotfile_repo_path: newRepoPath });
    });

    test("overwrites an existing config file", async () => {
        const path = `${TMP}/overwrite-config.yaml`;
        await configuration.setConfig(path, "/home/testuser/old-dotfiles");
        await configuration.setConfig(path, "/home/testuser/new-dotfiles");

        const result = await configuration.readAndFormatConfig(path);
        expect(result).toEqual({ dotfile_repo_path: "/home/testuser/new-dotfiles" });
    });
});
