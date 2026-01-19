import { describe, test, expect } from "bun:test";

import "../resources/global-setup";

import dotfileMarkers, { type DotfileMarker } from "../../src/fs/dotfileMarkers";

describe("getRepoPathFromMarkerPath", () => {
    test("getRepoPathFromMarkerPath returns correct path", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            _original_path: "/home/testuser/dotfiles/.dotfiles"
        };

        const res = dotfileMarkers.getRepoPathFromMarkerPath(marker);
        expect(res).toBe("/home/testuser/dotfiles/.zshrc");
    });

    test("getRepoPathFromMarkerPath root original path", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            _original_path: "/.dotfiles"
        };

        const res = dotfileMarkers.getRepoPathFromMarkerPath(marker);
        expect(res).toBe("/.zshrc");
    });
});

describe("YAMLDocumentToMarkerArr", () => {
    const path = "/home/testuser/dotfiles/.dotfiles";

    test("YAMLDocumentToMarkerArr single marker", () => {
        const yaml = `name: .zshrc\nlocation: /home/testuser/.zshrc`;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [{
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            _original_path: path
        }];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr multiple markers", () => {
        const yaml = `---\nname: .zshrc\nlocation: /home/testuser/.zshrc\n---\nname: .vimrc\nlocation: /home/testuser/.vimrc`;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [
            {
                name: ".zshrc",
                location: "/home/testuser/.zshrc",
                _original_path: path
            },
            {
                name: ".vimrc",
                location: "/home/testuser/.vimrc",
                _original_path: path
            }
        ];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr null document at end", () => {
        const yaml = `---\nname: .zshrc\nlocation: /home/testuser/.zshrc\n---\nname: .vimrc\nlocation: /home/testuser/.vimrc\n---`;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [
            {
                name: ".zshrc",
                location: "/home/testuser/.zshrc",
                _original_path: path
            },
            {
                name: ".vimrc",
                location: "/home/testuser/.vimrc",
                _original_path: path
            }
        ];
        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr invalid document missing key", () => {
        const yaml = `name: .zshrc`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow("Invalid dotfile markers file: missing 'name' or 'location' key");
    });

    test("YAMLDocumentToMarkerArr invalid document wrong type", () => {
        const yaml = `name: .zshrc\nlocation: 123`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow("Invalid dotfile markers file: 'name' and 'location' must be strings");
    });

    test("YAMLDocumentToMarkerArr invalid document extra keys", () => {
        const yaml = `name: .zshrc\nlocation: /home/testuser/.zshrc\nextra_key: value`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow("Invalid dotfile markers file: unexpected keys present");
    });
});