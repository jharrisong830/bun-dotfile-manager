import { Glob } from "bun";

const findAllDotfileMarkers = async (repoPath: string): Promise<Array<string>> => {
    const glob = new Glob("**/.dotfiles");
    return await Array.fromAsync(glob.scan(repoPath));
};

export default {
    findAllDotfileMarkers
};
