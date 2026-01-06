// commom utilities for files

const getFileText = async (file: Bun.BunFile): Promise<string> => {
    try {
        return await file.text();
    } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
    }
};

const writeFileText = async (file: Bun.BunFile, contents: string): Promise<void> => {
    try {
        await Bun.write(file, contents, { createPath: true });
    } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
    }
};

export default {
    getFileText,
    writeFileText
};
