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
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
        `;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [{
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            _original_path: path
        }];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr multiple markers", () => {
        const yaml = `
---
name: .zshrc
location: /home/testuser/.zshrc
---
name: .vimrc
location: /home/testuser/.vimrc
        `;

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

    test("YAMLDocumentToMarkerArr doc splitter in middle", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
---
name: .vimrc
location: /home/testuser/.vimrc
        `;

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
        const yaml = `
---
name: .zshrc
location: /home/testuser/.zshrc
---
name: .vimrc
location: /home/testuser/.vimrc
---
        `;

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
        const yaml = `
name: .zshrc
        `;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr invalid document wrong type", () => {
        const yaml = `
name: .zshrc
location: 123
        `;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr invalid document extra keys", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
extra_key: value
        `;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr empty document", () => {
        const yaml = ``;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr with platform override", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
linux:
    shouldLink: true
    location: /home/testuser/.linux_zshrc
win32:
    shouldLink: false
    location: C:/Users/testuser/.zshrc
        `;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [{
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            linux: {
                shouldLink: true,
                location: "/home/testuser/.linux_zshrc"
            },
            win32: {
                shouldLink: false,
                location: "C:/Users/testuser/.zshrc"
            },
            _original_path: path
        }];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr with platform override no path", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
linux:
    shouldLink: true
`;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [{
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            linux: {
                shouldLink: true
            },
            _original_path: path
        }];

        expect(res).toEqual(expected);
    });

    test("YAMLDocumentToMarkerArr with platform override missing shouldLink", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
linux:
    location: /home/testuser/.linux_zshrc
`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr with platform override wrong type", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
linux:
    shouldLink: "yes"
    location: /home/testuser/.linux_zshrc
`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr with platform override extra keys", () => {
        const yaml = `
name: .zshrc
location: /home/testuser/.zshrc
linux:
    shouldLink: true
    location: /home/testuser/.linux_zshrc
    extra_key: value
`;

        expect(() => dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path)).toThrow();
    });

    test("YAMLDocumentToMarkerArr multiple markers with platform overrides", () => {
        const yaml = `
---
name: .zshrc
location: /home/testuser/.zshrc
win32:
    shouldLink: false
---
name: .vimrc
location: /home/testuser/.vimrc
darwin: 
    shouldLink: true
    location: /Users/testuser/.config/.vimrc
win32:
    shouldLink: false
---
name: .gitconfig
location: /home/testuser/.gitconfig
`;

        const res = dotfileMarkers.YAMLDocumentToMarkerArr(yaml, path);
        const expected: Array<DotfileMarker> = [
            {
                name: ".zshrc",
                location: "/home/testuser/.zshrc",
                win32: {
                    shouldLink: false
                },
                _original_path: path
            },
            {
                name: ".vimrc",
                location: "/home/testuser/.vimrc",
                darwin: {
                    shouldLink: true,
                    location: "/Users/testuser/.config/.vimrc"
                },
                win32: {
                    shouldLink: false
                },
                _original_path: path
            },
            {
                name: ".gitconfig",
                location: "/home/testuser/.gitconfig",
                _original_path: path
            }
        ];

        expect(res).toEqual(expected);
    });
});
