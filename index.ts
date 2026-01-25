import configuration from "./src/util/configuration";
import argparse from "./src/util/argparse";
import dotfileMarkers from "./src/fs/dotfileMarkers";
import util from "./src/util/util";
import constants from "./src/util/constants";

const properties = await util.readPropertiesFile(Bun.file(APP_PROPERTIES));
const configPath = util.formatString(
    (properties["platform-path"] as Record<string, unknown>)[PLATFORM] as string, 
    { HOME: constants.HOME_DIR }
);

const args = argparse();
const command = args[0];

type CommandName = 
    "init" | 
    "get-config" | 
    "set-config" | 
    "version" | 
    "relink";

type CommandHandler = {
    helptext: string;
    handler: () => Promise<void>;
};

const commandHandlers: Record<CommandName, CommandHandler> = {
    "init": {
        helptext: "",
        handler: async () => {
            const doesExist = await configuration.doesConfigExist(configPath);
            if (doesExist) {
                console.error(`Configuration file already exists at ${configPath}`);
                process.exit(1);
            }
            await configuration.initializeConfigFile(configPath);
        }
    },
    "get-config": {
        helptext: "",
        handler: async () => {
            console.log(await configuration.readAndFormatConfig(configPath));
        }
    },
    "set-config": {
        helptext: "",
        handler: async () => {
            const dotfileRepoPath = args[1];
            if (!dotfileRepoPath) {
                console.error("Please provide a path for 'set-config' command.");
                process.exit(1);
            }
            await configuration.setConfig(configPath, dotfileRepoPath);
        }
    },
    "version": {
        helptext: "",
        handler: async () => {
            console.log(`bun-dotfile-manager version ${VERSION}\nbuilt on ${BUILD_TIME} from ${COMMIT_HASH}\nfor platform ${PLATFORM}`);
        }
    },
    "relink": {
        helptext: "",
        handler: async () => {
            const config = await configuration.readAndFormatConfig(configPath);
            const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(config.dotfile_repo_path);
            for (const marker of markers) {
                await dotfileMarkers.createSymlinkForDotfileMarker(marker);
            }
        }
    }
}

if (!command) {
    console.error("Please provide a command.");
    process.exit(1);
} else if (command in commandHandlers) {
    await commandHandlers[command as CommandName].handler();
} else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
