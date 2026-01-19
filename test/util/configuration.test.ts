import { expect, test, describe } from "bun:test"

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
    
