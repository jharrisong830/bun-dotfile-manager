import { describe, test, expect, afterAll } from "bun:test";

import "../resources/global-setup";

import { lstat, rm, mkdir, writeFile, symlink as nodeSymlink } from "node:fs/promises";
import { join } from "node:path";
import symlink from "../../src/fs/symlink";

const TMP = join(import.meta.dir, "../../tmp/symlink-tests");

afterAll(async () => {
    await rm(join(import.meta.dir, "../../tmp"), { recursive: true, force: true });
});

describe("unlinkDotfile", () => {
    test("does nothing when path does not exist", async () => {
        const target = join(TMP, "nonexistent");
        await symlink.unlinkDotfile(target);
    });

    test("removes an existing symlink", async () => {
        await mkdir(TMP, { recursive: true });
        const source = join(TMP, "source-file.txt");
        const link = join(TMP, "link-to-remove");
        await writeFile(source, "hello");
        await nodeSymlink(source, link);

        const statBefore = await lstat(link);
        expect(statBefore.isSymbolicLink()).toBe(true);

        await symlink.unlinkDotfile(link);

        const file = Bun.file(link);
        expect(await file.exists()).toBe(false);
    });

    test("throws when path exists and is a regular file", async () => {
        await mkdir(TMP, { recursive: true });
        const regularFile = join(TMP, "regular-file.txt");
        await writeFile(regularFile, "not a symlink");

        await expect(symlink.unlinkDotfile(regularFile)).rejects.toThrow();
    });

    test("throws when path exists and is a regular directory", async () => {
        await mkdir(TMP, { recursive: true });
        const dir = join(TMP, "regular-dir");
        await mkdir(dir, { recursive: true });

        await expect(symlink.unlinkDotfile(dir)).rejects.toThrow();
    });
});

describe("linkDotfile", () => {
    test("creates a symlink at destination pointing to source", async () => {
        await mkdir(TMP, { recursive: true });
        const source = join(TMP, "source-for-link.txt");
        const dest = join(TMP, "created-link");
        await writeFile(source, "content");

        await symlink.linkDotfile(source, dest);

        const stat = await lstat(dest);
        expect(stat.isSymbolicLink()).toBe(true);
    });

    test("creates parent directories if they do not exist", async () => {
        const source = join(TMP, "source-nested.txt");
        const dest = join(TMP, "nested/deep/link");
        await mkdir(TMP, { recursive: true });
        await writeFile(source, "content");

        await symlink.linkDotfile(source, dest);

        const stat = await lstat(dest);
        expect(stat.isSymbolicLink()).toBe(true);
    });

    test("replaces an existing symlink at destination", async () => {
        await mkdir(TMP, { recursive: true });
        const source1 = join(TMP, "source-a.txt");
        const source2 = join(TMP, "source-b.txt");
        const dest = join(TMP, "replaceable-link");

        await writeFile(source1, "first");
        await writeFile(source2, "second");
        await nodeSymlink(source1, dest);

        await symlink.linkDotfile(source2, dest);

        const stat = await lstat(dest);
        expect(stat.isSymbolicLink()).toBe(true);

        const text = await Bun.file(dest).text();
        expect(text).toBe("second");
    });

    test("throws when destination already exists as a regular file", async () => {
        await mkdir(TMP, { recursive: true });
        const source = join(TMP, "source-skip.txt");
        const dest = join(TMP, "existing-regular-file.txt");

        await writeFile(source, "source content");
        await writeFile(dest, "dest content");

        // unlinkDotfile refuses to remove non-symlinks, so linkDotfile throws
        await expect(symlink.linkDotfile(source, dest)).rejects.toThrow();
    });
});
