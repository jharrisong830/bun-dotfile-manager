import { describe, test, expect, afterAll, afterEach } from "bun:test";

import "../resources/global-setup";

import { rm, mkdir, writeFile, symlink as nodeSymlink, lstat } from "node:fs/promises";
import { join } from "node:path";
import dotfileMarkers, { type DotfileMarker } from "../../src/fs/dotfileMarkers";
import constants from "../../src/util/constants";

const TMP = join(import.meta.dir, "../../tmp/dotfile-marker-tests");

afterAll(async () => {
    await rm(TMP, { recursive: true, force: true });
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
    const originalPlatform = (globalThis as any).PLATFORM;

    afterEach(() => {
        (globalThis as any).PLATFORM = originalPlatform;
    });

    test("isDotfileLinkedOnCurrentPlatform returns true when no platform override is present", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc"
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(true);
    });

    test("isDotfileLinkedOnCurrentPlatform returns linux shouldLink when PLATFORM is linux", () => {
        (globalThis as any).PLATFORM = "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            linux: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(false);
    });

    test("isDotfileLinkedOnCurrentPlatform returns darwin shouldLink when PLATFORM is darwin", () => {
        (globalThis as any).PLATFORM = "darwin";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            darwin: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(false);
    });

    test("isDotfileLinkedOnCurrentPlatform returns win32 shouldLink when PLATFORM is win32", () => {
        (globalThis as any).PLATFORM = "win32";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            win32: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(false);
    });

    test("isDotfileLinkedOnCurrentPlatform returns true when only a different platform's override is present", () => {
        (globalThis as any).PLATFORM = "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/home/testuser/.zshrc",
            darwin: { shouldLink: false }
        };
        expect(dotfileMarkers.isDotfileLinkedOnCurrentPlatform(marker)).toBe(true);
    });
});

describe("getLocationForCurrentPlatform", () => {
    const originalPlatform = (globalThis as any).PLATFORM;

    afterEach(() => {
        (globalThis as any).PLATFORM = originalPlatform;
    });

    test("getLocationForCurrentPlatform returns formatted default location when no platform override", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "{HOME}/.zshrc"
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe(`${constants.HOME_DIR}/.zshrc`);
    });

    test("getLocationForCurrentPlatform substitutes {NAME} with the marker name", () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "{HOME}/dotfiles/{NAME}"
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe(`${constants.HOME_DIR}/dotfiles/.zshrc`);
    });

    test("getLocationForCurrentPlatform uses linux-specific location when PLATFORM is linux", () => {
        (globalThis as any).PLATFORM = "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            linux: { shouldLink: true, location: "/linux/specific/location" }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("/linux/specific/location");
    });

    test("getLocationForCurrentPlatform uses darwin-specific location when PLATFORM is darwin", () => {
        (globalThis as any).PLATFORM = "darwin";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            darwin: { shouldLink: true, location: "/darwin/specific/location" }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("/darwin/specific/location");
    });

    test("getLocationForCurrentPlatform uses win32-specific location when PLATFORM is win32", () => {
        (globalThis as any).PLATFORM = "win32";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            win32: { shouldLink: true, location: "C:/Users/testuser/.zshrc" }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("C:/Users/testuser/.zshrc");
    });

    test("getLocationForCurrentPlatform uses default location when platform override has no location field", () => {
        (globalThis as any).PLATFORM = "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            linux: { shouldLink: true }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("/default/location");
    });

    test("getLocationForCurrentPlatform uses default location when override exists only for a different platform", () => {
        (globalThis as any).PLATFORM = "linux";
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: "/default/location",
            darwin: { shouldLink: true, location: "/darwin/specific/location" }
        };
        const result = dotfileMarkers.getLocationForCurrentPlatform(marker);
        expect(result).toBe("/default/location");
    });
});

describe("findAllDotfileMarkers", () => {
    test("findAllDotfileMarkers finds .dotfiles files recursively in a directory tree", async () => {
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

    test("findAllDotfileMarkers returns empty array when no .dotfiles files exist", async () => {
        const emptyRepo = join(TMP, "empty-repo");
        await mkdir(emptyRepo, { recursive: true });

        const results = await dotfileMarkers.findAllDotfileMarkers(emptyRepo);
        expect(results).toEqual([]);
    });

    test("findAllDotfileMarkers does not return non-.dotfiles files", async () => {
        const repoRoot = join(TMP, "no-match-repo");
        await mkdir(repoRoot, { recursive: true });
        await writeFile(join(repoRoot, "dotfiles"), "name: a\nlocation: /a");
        await writeFile(join(repoRoot, ".dotfiles-extra"), "name: b\nlocation: /b");

        const results = await dotfileMarkers.findAllDotfileMarkers(repoRoot);
        expect(results).toEqual([]);
    });
});

describe("getAllDotfileMarkersForRepository", () => {
    test("getAllDotfileMarkersForRepository parses all markers from a repo tree", async () => {
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

    test("getAllDotfileMarkersForRepository returns empty array when repo has no .dotfiles files", async () => {
        const repoRoot = join(TMP, "empty-full-repo");
        await mkdir(repoRoot, { recursive: true });

        const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(repoRoot);
        expect(markers).toEqual([]);
    });

    test("getAllDotfileMarkersForRepository throws when a .dotfiles file contains invalid content", async () => {
        const repoRoot = join(TMP, "invalid-repo");
        await mkdir(repoRoot, { recursive: true });
        await writeFile(join(repoRoot, ".dotfiles"), "name: .zshrc\n# missing location key");

        await expect(dotfileMarkers.getAllDotfileMarkersForRepository(repoRoot)).rejects.toThrow();
    });
});

describe("createSymlinkForDotfileMarker", () => {
    test("createSymlinkForDotfileMarker creates a symlink from repo path to the resolved location", async () => {
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

    test("createSymlinkForDotfileMarker throws when destination already exists as a regular file", async () => {
        const repoRoot = join(TMP, "symlink-marker-throws-repo");
        await mkdir(repoRoot, { recursive: true });
        const sourceFile = join(repoRoot, ".zshrc");
        await writeFile(sourceFile, "# zshrc");

        const dest = join(TMP, "symlink-throws-dest/.zshrc");
        const destDir = join(TMP, "symlink-throws-dest");
        await mkdir(destDir, { recursive: true });
        await writeFile(dest, "# existing file");

        const marker: DotfileMarker = {
            name: ".zshrc",
            location: dest,
            _original_path: join(repoRoot, ".dotfiles")
        };

        await expect(dotfileMarkers.createSymlinkForDotfileMarker(marker)).rejects.toThrow();
    });
});

describe("deleteSymlinkForDotfileMarker", () => {
    test("deleteSymlinkForDotfileMarker removes a symlink at the resolved location", async () => {
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

    test("deleteSymlinkForDotfileMarker does nothing when the symlink does not exist", async () => {
        const marker: DotfileMarker = {
            name: ".zshrc",
            location: join(TMP, "nonexistent-link/.zshrc"),
            _original_path: join(TMP, ".dotfiles")
        };

        await dotfileMarkers.deleteSymlinkForDotfileMarker(marker);
    });
});
