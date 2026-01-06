import fg from "fast-glob";

const PATTERN = "**/.dotfiles";

const findAllDotfileMarkers = async (repoPath: string): Promise<Array<string>> => {
    const entries = await fg(PATTERN, {
        cwd: repoPath,
        onlyFiles: true,
        absolute: true
    });

    return entries;
};

export default {
    findAllDotfileMarkers
};
