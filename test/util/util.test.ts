import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { rm } from "node:fs/promises";

import "../resources/global-setup";

import util from "../../src/util/util";
import { beforeEach } from "node:test";

describe("formatString", () => {
    test("formatString no placeholders, no values", () => {
        const res = util.formatString("Hello, world!", {});
        expect(res).toBe("Hello, world!");
    });

    test("formatString with placeholders, no values", () => {
        const res = util.formatString("Hello, {NAME}!", {});
        expect(res).toBe("Hello, {NAME}!"); // templates without values are unchanged
    });

    test("formatString no placeholders, with values", () => {
        const res = util.formatString("Hello, world!", { NAME: "John" });
        expect(res).toBe("Hello, world!");
    });

    test("formatString with placeholders, with values", () => {
        const res = util.formatString("Hello, {NAME}!", { NAME: "John" });
        expect(res).toBe("Hello, John!");
    });

    test("formatString with multiple placeholders, with multiple values", () => {
        const res = util.formatString("Hello, {NAME}! Welcome to {PLACE}.", { NAME: "John", PLACE: "Bun" });
        expect(res).toBe("Hello, John! Welcome to Bun.");
    });

    test("formatString with multiple placeholders, some values missing", () => {
        const res = util.formatString("Hello, {NAME}! Welcome to {PLACE}.", { NAME: "John" });
        expect(res).toBe("Hello, John! Welcome to {PLACE}.");
    });

    test("formatString with repeated placeholders", () => {
        const res = util.formatString("Hello, {NAME}! Your name is {NAME}.", { NAME: "John" });
        expect(res).toBe("Hello, John! Your name is John.");
    });
});

describe("getFileText", () => {
    const tempDir = "temp";
    const tempFilePath = `${tempDir}/test.txt`;
    const tempContents = "test file\n";
    
    beforeAll(async () => {
        try {
            if (await Bun.file(tempDir).exists()) {
                await rm(tempDir, { recursive: true });
            }
            await util.writeFileText(Bun.file(tempFilePath), tempContents);    
        } catch (error) {
            console.error("Couldn't set up temp file. Tests may fail.", error);
        }
    });

    test("getFileText passes", async () => {
        const res = await util.getFileText(Bun.file(tempFilePath));
        expect(res).toBe(tempContents);
    });

    test("getFileText file not found", async () => {
        expect(util.getFileText(Bun.file("temp/dne.txt"))).rejects.toThrow();
    });

    afterAll(async () => {
        try {
            await rm(tempDir, { recursive: true });
        } catch (error) {
            console.error("Couldn't clean temp directory", error);
        }
    });
});

describe("writeTextFile", () => {
    const tempDir = "temp";
    const tempFilePath = `${tempDir}/test.txt`;
    const tempContents = "test file\n";
    
    beforeAll(async () => {
        try {
            if (await Bun.file(tempDir).exists()) {
                await rm(tempDir, { recursive: true });
            }
        } catch (error) {
            console.error("Couldn't set up temp file. Tests may fail.", error);
        }
    });

    test("writeFileText passes", async () => {
        await util.writeFileText(Bun.file(tempFilePath), tempContents);

        const writtenContents = await util.getFileText(Bun.file(tempFilePath));
        expect(writtenContents).toBe(tempContents);
    });

    test("writeFileText passes when file exists", async () => {
        const newContents = "test\n#2!\n";
        await util.writeFileText(Bun.file(tempFilePath), tempContents);
        await util.writeFileText(Bun.file(tempFilePath), newContents); // should overwrite

        const writtenContents = await util.getFileText(Bun.file(tempFilePath));
        expect(writtenContents).toBe(newContents);
    });

    afterAll(async () => {
        try {
            await rm(tempDir, { recursive: true });
        } catch (error) {
            console.error("Couldn't clean temp directory", error);
        }
    });
});

describe("readPropertiesFile", () => {
    const propertiesFile = Bun.file(APP_PROPERTIES);

    test("readPropertiesFile passes", async () => {
        const res = await util.readPropertiesFile(propertiesFile);
        
        expect(res).toEqual({
            "platform-path": {
                win32: "test/resources/config.yaml",
                linux: "test/resources/config.yaml",
                darwin: "test/resources/config.yaml"
            }
        });
    });
});

describe("convertToForwardSlashes", () => {
    test("convertToForwardSlashes on Windows path", () => {
        const path = "C:\\Users\\johng\\file.txt";
        const expected = "C:/Users/johng/file.txt";
        const res = util.convertToForwardSlashes(path);
        expect(res).toBe(expected);
    });

    test("convertToForwardSlashes on mixed path", () => {
        const path = "C:\\Users\\johng/file.txt";
        const expected = "C:/Users/johng/file.txt";
        const res = util.convertToForwardSlashes(path);
        expect(res).toBe(expected);
    });

    test("convertToForwardSlashes no backslashes", () => {
        const path = "/home/johng/file.txt";
        const res = util.convertToForwardSlashes(path);
        expect(res).toBe(path);
    });

    test("convertToForwardSlashes empty string", () => {
        const path = "";
        const res = util.convertToForwardSlashes(path);
        expect(res).toBe(path);
    });

    test("convertToForwardSlashes backslash at end", () => {
        const path = "C:\\Users\\johng\\";
        const expected = "C:/Users/johng/";
        const res = util.convertToForwardSlashes(path);
        expect(res).toBe(expected);
    });
});

describe("doesDirectoryExist", () => {
    test("doesDirectoryExist directory exists", async () => {
        const realDirectory = "test/resources";
        const res = await util.doesDirectoryExist(realDirectory);
        expect(res).toBe(true);
    });

    test("doesDirectoryExist directory does not exist", async () => {
        const fakeDirectory = "test/dne";
        const res = await util.doesDirectoryExist(fakeDirectory);
        expect(res).toBe(false);
    });

    test("doesDirectoryExist path is a file", async () => {
        const realFile = "test/resources/config.yaml";
        const res = await util.doesDirectoryExist(realFile);
        expect(res).toBe(false);
    });

    test("doesDirectoryExist path does not exist", async () => {
        const fakeFile = "test/resources/dne.txt";
        const res = await util.doesDirectoryExist(fakeFile);
        expect(res).toBe(false);
    });
});

describe("createDirectoryAtPath", () => {
    const tempDir = "temp";

    beforeEach(async () => {
        try {
            if (await util.doesDirectoryExist(tempDir)) {
                await rm(tempDir, { recursive: true });
            }
        } catch (error) {
            console.error("Couldn't clean up temp dir. Tests may fail.", error);
        }
    });

    test("createDirectoryAtPath creates directory", async () => {
        expect(await util.doesDirectoryExist(tempDir)).toBe(false);

        await util.createDirectoryAtPath(tempDir);
        expect(await util.doesDirectoryExist(tempDir)).toBe(true);
    });

    test("createDirectoryAtPath creates nested directories", async () => {
        const nestedDir = `${tempDir}/a/b/c/d/e/f/g`;
        expect(await util.doesDirectoryExist(nestedDir)).toBe(false);

        await util.createDirectoryAtPath(nestedDir);
        expect(await util.doesDirectoryExist(nestedDir)).toBe(true);
    });

    afterAll(async () => {
        try {
            await rm(tempDir, { recursive: true });
        } catch (error) {
            console.error("Couldn't clean temp directory", error);
        }
    });
});
