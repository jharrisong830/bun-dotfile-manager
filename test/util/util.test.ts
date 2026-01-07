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
