import nfs, { symlink, lstat } from "node:fs/promises";
import { createDirectoryAtPath, doesDirectoryExist } from "../util/util";

const linkDotfile = async (source: string, destination: string): Promise<void> => {
    console.log(`Linking ${source} to ${destination}...`);
    await unlinkDotfile(destination);

    const file = Bun.file(destination);
    const parent = destination.split("/").slice(0, -1).join("/");
    if (!(await doesDirectoryExist(parent))) {
        console.log(`Creating parent directory at ${parent}...`);
        await createDirectoryAtPath(parent);
    }
    if (!(await file.exists())) {
        await symlink(source, destination);
        console.log("linked!");
    } else {
        console.log(`${destination} already exists. Skipping link creation.`);
    }
};

const unlinkDotfile = async (linkPath: string): Promise<void> => {
    console.log(`Unlinking ${linkPath} if it exists...`);
    const file = Bun.file(linkPath);
    if ((await file.exists()) || (await doesDirectoryExist(linkPath))) {
        console.log("exists!");
        const nodefsStat = await lstat(linkPath);
        console.log(nodefsStat);
        if (nodefsStat.isSymbolicLink()) {
            console.log(`Removing symlink at ${linkPath}`);
            await file.delete();
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
