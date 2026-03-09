import { symlink, lstat, unlink } from "node:fs/promises";
import { createDirectoryAtPath, doesDirectoryExist } from "../util/util";

const linkDotfile = async (source: string, destination: string): Promise<void> => {
    console.log(`Linking ${source} to ${destination}...`);
    await unlinkDotfile(destination);

    const parent = destination.split("/").slice(0, -1).join("/");
    if (!(await doesDirectoryExist(parent))) {
        console.log(`Creating parent directory at ${parent}...`);
        await createDirectoryAtPath(parent);
    }
    try {
        await symlink(source, destination);
        console.log("linked!");
    } catch (err: any) {
        if (err.code !== "EEXIST") throw err;
        console.log(`${destination} already exists. Skipping link creation.`);
    }
};

const unlinkDotfile = async (linkPath: string): Promise<void> => {
    console.log(`Unlinking ${linkPath} if it exists...`);
    if ((await Bun.file(linkPath).exists()) || (await doesDirectoryExist(linkPath))) {
        console.log("exists!");
        const nodefsStat = await lstat(linkPath);
        if (nodefsStat.isSymbolicLink()) {
            console.log(`Removing symlink at ${linkPath}`);
            await unlink(linkPath);
            console.log("removed!");
        } else {
            throw new Error(`${linkPath} exists and is not a symlink. Refusing to delete.`);
        }
    }
};

export default {
    linkDotfile,
    unlinkDotfile
};
