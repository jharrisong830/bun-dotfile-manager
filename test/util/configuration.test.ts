import { expect, test, describe, beforeEach, afterAll } from "bun:test";
import { rm } from "node:fs/promises";

import "../resources/global-setup";

import configuration, { type Configuration } from "../../src/util/configuration";
import util from "../../src/util/util";
import constants from "../../src/util/constants";

const properties = await util.readPropertiesFile(Bun.file(APP_PROPERTIES));
const configPath = util.formatString(
    (properties["platform-path"] as Record<string, unknown>)[PLATFORM] as string, 
    { HOME: constants.HOME_DIR }
);

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
        expect(configPath).toBe("test/resources/config.yaml");

        const res = await configuration.doesConfigExist(configPath);
        expect(res).toBe(true);
    });

    test("doesConfigExist file not exists", async () => {
        const invalidFilePath = "test/resources/dne.yaml";

        const res = await configuration.doesConfigExist(invalidFilePath);
        expect(res).toBe(false);
    });
});

describe ("initializeConfigFile", async () => {
    const tempConfigDir = "temp";
    const tempConfigPath = `${tempConfigDir}/test-config.yaml`

    beforeEach(async () => {
        try {
            if (await Bun.file(tempConfigDir).exists()) {
                await rm(tempConfigDir, { recursive: true });
            }
        } catch (error) {
            console.error("Couldn't clean up temp config directory. Tests may fail.", error);
        }
    });

    test("initializeConfigFile creates file with default contents", async () => {
        await configuration.initializeConfigFile(tempConfigPath);

        const configAfter = await util.getFileText(Bun.file(tempConfigPath));
        const expectedConfigYAML = configuration.configObjToYAML(constants.DEFAULT_CONFIG);
        expect(configAfter.trim()).toBe(expectedConfigYAML);
    });

    afterAll(async () => {
        try {
            await rm(tempConfigDir, { recursive: true });
        } catch (error) {
            console.error("Couldn't clean temp config directory", error);
        }
    });
});

describe("readAndFormatConfig", () => {
    test("readAndFormatConfig file exists", async () => {
        expect(configPath).toBe("test/resources/config.yaml");
        
        const res = await configuration.readAndFormatConfig(configPath);
        const expected: Configuration = {
            dotfile_repo_path: "/home/testuser/dotfiles"
        };
        expect(res).toEqual(expected);
    });

    test("readAndFormatConfig file not exists", async () => {
        const invalidFilePath = "test/resources/dne.yaml";
        expect(configuration.readAndFormatConfig(invalidFilePath)).rejects.toThrow();
    });

    test("readAndFormatConfig invalid contents", async () => {
        const invalidContentsPath = "test/resources/global-setup.ts"; // will not be parsed by YAMLStringToConfigObj
        expect(configuration.readAndFormatConfig(invalidContentsPath)).rejects.toThrow();
    });
});

describe("setConfig", async () => {
    const tempConfigDir = "temp";
    const tempConfigPath = `${tempConfigDir}/test-config.yaml`
    const originalConfigContents = await util.getFileText(Bun.file(configPath));

    beforeEach(async () => {
        try {
            if (await Bun.file(tempConfigDir).exists()) {
                await rm(tempConfigDir, { recursive: true });
            }
            await util.writeFileText(Bun.file(tempConfigPath), originalConfigContents);
        } catch (error) {
            console.error("Couldn't set up temp config files. Tests may fail.", error);
        }
    });

    test("setConfig updates config file", async () => {
        const configBefore = await util.getFileText(Bun.file(tempConfigPath));
        expect(configBefore).toBe(originalConfigContents);

        const newDotfileRepoPath = "/new/path/dotfiles";
        await configuration.setConfig(tempConfigPath, newDotfileRepoPath);

        const configAfter = await util.getFileText(Bun.file(tempConfigPath));
        const expectedConfigObj: Configuration = {
            dotfile_repo_path: newDotfileRepoPath
        };
        const expectedConfigYAML = configuration.configObjToYAML(expectedConfigObj);
        expect(configAfter.trim()).toBe(expectedConfigYAML);
    });

    test("setConfig writes if not present", async () => {
        const configBefore = await util.getFileText(Bun.file(tempConfigPath));
        expect(configBefore).toBe(originalConfigContents);
        
        const differentConfigPath = "temp/nonexistent/config.yaml";
        const newDotfileRepoPath = "/new/path/dotfiles";
        await configuration.setConfig(differentConfigPath, newDotfileRepoPath);

        const configAfter = await util.getFileText(Bun.file(differentConfigPath));
        const expectedConfigObj: Configuration = {
            dotfile_repo_path: newDotfileRepoPath
        };
        const expectedConfigYAML = configuration.configObjToYAML(expectedConfigObj);
        expect(configAfter.trim()).toBe(expectedConfigYAML);
    });

    afterAll(async () => {
        try {
            await rm(tempConfigDir, { recursive: true });
        } catch (error) {
            console.error("Couldn't clean temp config directory", error);
        }
    });
});
    
