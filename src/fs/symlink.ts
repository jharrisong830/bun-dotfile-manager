import { symlink } from "node:fs/promises";

const linkDotfile = async (source: string, destination: string): Promise<void> => {
    console.log(`Linking ${source} to ${destination}...`);
    await unlinkDotfile(destination);
    await symlink(source, destination);
    console.log("linked!");
};

const unlinkDotfile = async (linkPath: string): Promise<void> => {
    console.log(`Unlinking ${linkPath} if it exists...`);
    const file = Bun.file(linkPath);
    try {
        if (await file.exists()) {
            console.log(`Removing symlink at ${linkPath}`);
            await file.delete();
            console.log("removed!");
    }
    } catch (error) {
        console.warn(`Warning: could not unlink ${linkPath}: ${error}`);
    } 
};

export default {
    linkDotfile,
    unlinkDotfile
};
