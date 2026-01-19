import { expect, test, describe } from "bun:test";

import "../resources/global-setup";

import util from "../../src/util/util";

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
