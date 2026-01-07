import { Glob, YAML } from "bun";
import util from "../util/util";
import constants from "../util/constants";
import symlink from "../fs/symlink";

export type DotfileMarker = {
    name: string; // name of the file
    location: string; // where the file should be symlinked to
    _original_path?: string; // where the .dotfiles path is located (not included in the .dotfiles schema)
};


/**
 * given a marker, returns the path to the actual dotfile in the repository
 * @param marker 
 * @returns 
 */
const getRepoPathFromMarkerPath = (marker: DotfileMarker): string => {
    const dir = marker._original_path!.split("/").slice(0, -1).join("/");
    return `${dir}/${marker.name}`;
};

const createSymlinkForDotfileMarker = async (marker: DotfileMarker): Promise<void> => {
    const sourcePath = getRepoPathFromMarkerPath(marker);

    await symlink.linkDotfile(sourcePath, marker.location);
};


/**
 * finds all `.dotfiles` files under a given path
 * @param repoPath path under which to search
 * @returns 
 */
const findAllDotfileMarkers = (repoPath: string): Promise<Array<string>> => {
    const glob = new Glob("**/.dotfiles");
    return Array.fromAsync(glob.scan({ cwd: repoPath, dot: true, absolute: true }));
};

/**
 * returns dotfile marker objects for all `.dotfiles` files under a given repository path
 * @param repoPath 
 * @returns 
 */
const getAllDotfileMarkersForRepository = async (repoPath: string): Promise<Array<DotfileMarker>> => {
    const allMarkers: Array<DotfileMarker> = [];
    const paths = await findAllDotfileMarkers(repoPath);
    
    for (const path of paths) {
        const file = Bun.file(path);
        const contents = await util.getFileText(file);
        
        const formattedContents = util.formatString(contents, { HOME: constants.HOME_DIR });
        if (formattedContents.trim() === "") continue; // skip if no dotfiles are listed

        const markers = YAMLDocumentToMarkerArr(formattedContents, path);
        allMarkers.push(...markers);
    }

    return allMarkers;
};


/**
 * converts a dotfile marker into a YAML string 
 * @param marker 
 * @returns 
 */
const markerObjToYAML = (marker: DotfileMarker): string => {
    const markerCopy = { ...marker };
    delete markerCopy._original_path;
    return YAML.stringify(markerCopy, null, 4);
};

/**
 * converts a YAML document string into an array of dotfile marker objects
 * @param yamlString 
 * @param originalPath
 * @returns 
 * @throws if the document is invalid
 */
const YAMLDocumentToMarkerArr = (yamlString: string, originalPath: string): Array<DotfileMarker> => {
    const obj = YAML.parse(yamlString) as Array<Record<string, unknown>>;
    
    for (const item of obj) {
        if (obj === null || typeof obj !== "object") {
            throw new Error("Invalid dotfile markers file: not a valid YAML object");
        }
        if (!Object.keys(item).includes("name") || !Object.keys(item).includes("location")) {
            throw new Error("Invalid dotfile markers file: missing 'name' or 'location' key");
        } 
        if (typeof item["name"] !== "string" || typeof item["location"] !== "string") {
            throw new Error("Invalid dotfile markers file: 'name' and 'location' must be strings");
        }
        if (Object.keys(item).length !== 2) {
            throw new Error("Invalid dotfile markers file: unexpected keys present");
        }

        item["_original_path"] = util.convertToForwardSlashes(originalPath);
    }

    return obj as Array<DotfileMarker>;
};

export default {
    markerObjToYAML,
    YAMLDocumentToMarkerArr,
    findAllDotfileMarkers,
    getAllDotfileMarkersForRepository,
    getRepoPathFromMarkerPath,
    createSymlinkForDotfileMarker
};
