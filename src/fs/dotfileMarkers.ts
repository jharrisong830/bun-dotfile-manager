import { YAML } from "bun";

export type DotfileMarker = {
    name: string; // name of the file
    location: string; // where the file should be symlinked to
}


const markerObjToYAML = (marker: DotfileMarker): string => {
    return YAML.stringify(marker, null, 4);
};

const YAMLDocumentToMarkerArr = (yamlString: string): Array<DotfileMarker> => {
    const obj = YAML.parse(yamlString) as Array<Record<string, unknown>>;
    
    for (const item of obj) {
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
    YAMLDocumentToMarkerArr
};
