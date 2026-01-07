import { Glob, YAML } from "bun";
import util from "../util/util";
import constants from "../util/constants";

export type DotfileMarker = {
    name: string; // name of the file
    location: string; // where the file should be symlinked to
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
    console.log(repoPath);
    console.log(paths)
    
    for (const path of paths) {
        const file = Bun.file(path);
        const contents = await util.getFileText(file);
        
        const formattedContents = util.formatString(contents, { HOME: constants.HOME_DIR });
        if (formattedContents.trim() === "") continue; // skip if no dotfiles are listed

        const markers = YAMLDocumentToMarkerArr(formattedContents);
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
    return YAML.stringify(marker, null, 4);
};

/**
 * converts a YAML document string into an array of dotfile marker objects
 * @param yamlString 
 * @returns 
 * @throws if the document is invalid
 */
const YAMLDocumentToMarkerArr = (yamlString: string): Array<DotfileMarker> => {
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
    }

    return obj as Array<DotfileMarker>;
};

export default {
    markerObjToYAML,
    YAMLDocumentToMarkerArr,
    findAllDotfileMarkers,
    getAllDotfileMarkersForRepository
};
