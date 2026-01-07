import configuration from "./src/util/configuration";
import argparse from "./src/util/argparse";
import buildInfo from "./src/util/build";
import dotfileMarkers from "./src/fs/dotfileMarkers";
import util from "./src/util/util";
import constants from "./src/util/constants";

const properties = await util.readPropertiesFile(Bun.file(APP_PROPERTIES));
const configPath = util.formatString(
    (properties["platform-path"] as Record<string, unknown>)[buildInfo.platform] as string, 
    { HOME: constants.HOME_DIR }
);

const args = argparse();
const command = args[0];

switch (command) {
    case "init":
        const doesExist = await configuration.doesConfigExist(configPath);
        if (doesExist) {
            // TODO: warn here
        }
        await configuration.initializeConfigFile(configPath);
        break;
    case "get-config":
        console.log(await configuration.readAndFormatConfig(configPath));
        break;
    case "set-config":
        const dotfileRepoPath = args[1];
        if (!dotfileRepoPath) {
            console.error("Please provide a path for 'set-config' command.");
            process.exit(1);
        }
        await configuration.setConfig(configPath, dotfileRepoPath);
        break;
    case "version":
        console.log(`bun-dotfile-manager version ${buildInfo.version}\nbuilt on ${buildInfo.buildTime} from ${buildInfo.commitHash}\nfor platform ${buildInfo.platform}`);
        break;
    case "test":
        const config = await configuration.readAndFormatConfig(configPath);
        const markerPaths = await dotfileMarkers.getAllDotfileMarkersForRepository(config.dotfile_repo_path);
        for (const path of markerPaths) {
            console.log(path);
        }
        break;
    default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
}
