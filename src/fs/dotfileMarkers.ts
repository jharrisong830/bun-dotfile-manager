import { Glob, YAML } from "bun";
import * as z from "zod";

import util from "../util/util";
import constants from "../util/constants";
import symlink from "../fs/symlink";


const PlatformOverrideSchema = z.strictObject({
    shouldLink: z.boolean(),
    location: z.string().optional()
});

const DotfileMarkerSchema = z.strictObject({
    name: z.string(),
    location: z.string(),
    _original_path: z.string().optional(),

    linux: PlatformOverrideSchema.optional(),
    darwin: PlatformOverrideSchema.optional(),
    win32: PlatformOverrideSchema.optional()
});

export type DotfileMarker = z.infer<typeof DotfileMarkerSchema>;

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

    let location = marker.location;

    if (PLATFORM === "linux" && marker.linux) {
        if (!marker.linux.shouldLink) return;
        if (marker.linux.location) {
            location = marker.linux.location;
        }
    } else if (PLATFORM === "darwin" && marker.darwin) {
        if (!marker.darwin.shouldLink) return;
        if (marker.darwin.location) {
                location = marker.darwin.location;
            }
    } else if (PLATFORM === "win32" && marker.win32) {
        if (!marker.win32.shouldLink) return; 
        if (marker.win32.location) {
            location = marker.win32.location;
        }
    }

    await symlink.linkDotfile(sourcePath, location);
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
        
        const markers = YAMLDocumentToMarkerArr(contents, path).map(marker => {
            return {
                ...marker,
                location: util.formatString(marker.location, { HOME: constants.HOME_DIR, FILENAME: marker.name })
            };
        });
        allMarkers.push(...markers);
    }

    return allMarkers;
};

/**
 * converts a YAML document string into an array of dotfile marker objects
 * @param yamlString 
 * @param originalPath
 * @returns 
 * @throws if the document is invalid
 */
const YAMLDocumentToMarkerArr = (yamlString: string, originalPath: string): Array<DotfileMarker> => {
    let obj = YAML.parse(yamlString) as Array<Record<string, unknown>> | Record<string, unknown>;
    if (!Array.isArray(obj)) {
        obj = [obj];
    }
    obj = obj.filter(item => item !== null && item !== undefined);

    let result: Array<DotfileMarker> = [];
    
    for (const item of obj) {
        const parsed = DotfileMarkerSchema.parse(item);
        parsed._original_path = util.convertToForwardSlashes(originalPath);
        result.push(parsed);
    }

    return result;
};

export default {
    YAMLDocumentToMarkerArr,
    findAllDotfileMarkers,
    getAllDotfileMarkersForRepository,
    getRepoPathFromMarkerPath,
    createSymlinkForDotfileMarker
};
