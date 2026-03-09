import { describe, test, expect, afterAll } from "bun:test";

import "../resources/global-setup";

import { rm, mkdir, writeFile, symlink as nodeSymlink, lstat } from "node:fs/promises";
import { join } from "node:path";
import dotfileMarkers, { type DotfileMarker } from "../../src/fs/dotfileMarkers";
import constants from "../../src/util/constants";

const TMP = join(import.meta.dir, "../../tmp/dotfile-marker-tests");

afterAll(async () => {
    await rm(join(import.meta.dir, "../../tmp"), { recursive: true, force: true });
});

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

describe("isDotfileLinkedOnCurrentPlatform", () => {
    test("returns true when no platform override is present", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc"
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(true);
    });

    test("returns platform shouldLink when platform override exists for current platform", () => {
        const platform = process.platform as "linux" | "darwin" | "win32";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            [platform]: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(false);
    });

    test("returns true when override exists only for a different platform", () => {
        // Pick a platform that is definitely not the current one
        const otherPlatform = process.platform === "linux" ? "darwin" : "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            [otherPlatform]: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(true);
    });
});

describe("getLocationForCurrentPlatform", () => {
    test("returns formatted default location when no platform override", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "{HOME}/.zshrc"
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe(`${constants.HOME_DIR}/.zshrc`);
    });

    test("substitutes {FILENAME} with the marker name", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "{HOME}/dotfiles/{FILENAME}"
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe(`${constants.HOME_DIR}/dotfiles/.zshrc`);
    });

    test("uses platform-specific location when override exists for current platform", () => {
        const platform = process.platform as "linux" | "darwin" | "win32";
        const platformLocation = "/platform/specific/location";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            [platform]: { shouldLink: true, location: platformLocation }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe(platformLocation);
    });

    test("uses default location when platform override has no location field", () => {
        const platform = process.platform as "linux" | "darwin" | "win32";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            [platform]: { shouldLink: true }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("/default/location");
    });
});

describe("findAllDotfileMarkers", () => {
    test("finds .dotfiles files recursively in a directory tree", async () => {
        const repoRoot = join(TMP, "find-test-repo");
        await mkdir(join(repoRoot, "subdir/nested"), { recursive: true });
        await writeFile(join(repoRoot, ".dotfiles"), "name: a\nlocation: /a");
        await writeFile(join(repoRoot, "subdir/.dotfiles"), "name: b\nlocation: /b");
        await writeFile(join(repoRoot, "subdir/nested/.dotfiles"), "name: c\nlocation: /c");

        const results = await dotfileMarkers.findAllDotfileMarkers(repoRoot);
        expect(results.length).toBe(3);
        for (const r of results) {
            expect(r.endsWith("/.dotfiles")).toBe(true);
        }
    });

    test("returns empty array when no .dotfiles files exist", async () => {
        const emptyRepo = join(TMP, "empty-repo");
        await mkdir(emptyRepo, { recursive: true });

        const results = await dotfileMarkers.findAllDotfileMarkers(emptyRepo);
        expect(results).toEqual([]);
    });

    test("does not return non-.dotfiles files", async () => {
        const repoRoot = join(TMP, "no-match-repo");
        await mkdir(repoRoot, { recursive: true });
        await writeFile(join(repoRoot, "dotfiles"), "name: a\nlocation: /a");
        await writeFile(join(repoRoot, ".dotfiles-extra"), "name: b\nlocation: /b");

        const results = await dotfileMarkers.findAllDotfileMarkers(repoRoot);
        expect(results).toEqual([]);
    });
});

describe("getAllDotfileMarkersForRepository", () => {
    test("parses all markers from a repo tree", async () => {
        const repoRoot = join(TMP, "full-repo");
        await mkdir(join(repoRoot, "configs"), { recursive: true });
        await writeFile(join(repoRoot, ".dotfiles"), "name: .zshrc\nlocation: /home/user/.zshrc");
        await writeFile(
            join(repoRoot, "configs/.dotfiles"),
            "---\nname: .vimrc\nlocation: /home/user/.vimrc\n---\nname: .gitconfig\nlocation: /home/user/.gitconfig"
        );

        const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(repoRoot);
        expect(markers.length).toBe(3);

        const names = markers.map(m => m.name);
        expect(names).toContain(".zshrc");
        expect(names).toContain(".vimrc");
        expect(names).toContain(".gitconfig");

        for (const m of markers) {
            expect(typeof m._original_path).toBe("string");
        }
    });

    test("returns empty array when repo has no .dotfiles files", async () => {
        const repoRoot = join(TMP, "empty-full-repo");
        await mkdir(repoRoot, { recursive: true });

        const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(repoRoot);
        expect(markers).toEqual([]);
    });
});

describe("createSymlinkForDotfileMarker", () => {
    test("creates a symlink from repo path to the resolved location", async () => {
        const repoRoot = join(TMP, "symlink-marker-repo");
        await mkdir(repoRoot, { recursive: true });
        const sourceFile = join(repoRoot, ".zshrc");
        await writeFile(sourceFile, "# zshrc");

        const dest = join(TMP, "symlink-dest/.zshrc");
        const destDir = join(TMP, "symlink-dest");
        await mkdir(destDir, { recursive: true });

        const marker: DotfileMarker = {
            name: ".zshrc",
            location: dest,
            _original_path: join(repoRoot, ".dotfiles")
        };

        await dotfileMarkers.createSymlinkForDotfileMarker(marker);

        const stat = await lstat(dest);
        expect(stat.isSymbolicLink()).toBe(true);
    });
});

describe("deleteSymlinkForDotfileMarker", () => {
    test("removes a symlink at the resolved location", async () => {
        const repoRoot = join(TMP, "delete-marker-repo");
        await mkdir(repoRoot, { recursive: true });
        const sourceFile = join(repoRoot, ".zshrc");
        await writeFile(sourceFile, "# zshrc");

        const dest = join(TMP, "delete-dest/.zshrc");
        const destDir = join(TMP, "delete-dest");
        await mkdir(destDir, { recursive: true });
        await nodeSymlink(sourceFile, dest);

        const marker: DotfileMarker = {
            name: ".zshrc",
            location: dest,
            _original_path: join(repoRoot, ".dotfiles")
        };

        await dotfileMarkers.deleteSymlinkForDotfileMarker(marker);

        const file = Bun.file(dest);
        expect(await file.exists()).toBe(false);
    });

    test("does nothing when the symlink does not exist", async () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: join(TMP, "nonexistent-link/.zshrc"),
            _original_path: join(TMP, ".dotfiles")
        };

        await dotfileMarkers.deleteSymlinkForDotfileMarker(marker);
    });
});
