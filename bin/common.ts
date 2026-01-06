export const getVersionNumber = async (): Promise<string> => {
    const pkg = await import("../package.json", { assert: { type: "json" } });
    return pkg.version;
};

export default {
    getVersionNumber
};
