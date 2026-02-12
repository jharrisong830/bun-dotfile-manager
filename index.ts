import configuration from "./src/util/configuration";
import argparse from "./src/util/argparse";
import dotfileMarkers from "./src/fs/dotfileMarkers";
import util from "./src/util/util";
import constants from "./src/util/constants";
import properties from "./src/resources/properties.yaml";

const configPath = util.formatString(
    (properties["platform-path"] as Record<string, unknown>)[PLATFORM] as string, 
    { HOME: constants.HOME_DIR }
);

const { positionals, dotfile_repo_path } = argparse();
const command = positionals[0];

type CommandName = 
      "init" 
    | "get-config"
    | "set-config"
    | "version" 
    | "relink" 
    | "unlink"
    | "list"
    | "help";

type CommandHandler = {
    helptext: string;
    handler: () => Promise<void>;
};

const commandHandlers: Record<CommandName, CommandHandler> = {
    "init": {
        helptext: "init\ninitializes a new configuration file",
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
        helptext: "get-config\nretrieves and displays the current configuration",
        handler: async () => {
            console.log(await configuration.readAndFormatConfig(configPath));
        }
    },
    "set-config": {
        helptext: "set-config <dotfile_repo_path>\nsets the dotfile repository path in the configuration",
        handler: async () => {
            const dotfileRepoPath = positionals[1];
            if (!dotfileRepoPath) {
                console.error("Please provide a path for 'set-config' command.");
                process.exit(1);
            }
            await configuration.setConfig(configPath, dotfileRepoPath);
        }
    },
    "version": {
        helptext: "version\ndisplays version information",
        handler: async () => {
            console.log(`bdfm (Bun DotFile Manager) version ${VERSION}\nbuilt on ${BUILD_TIME} from ${COMMIT_HASH}\nfor platform ${PLATFORM}`);
        }
    },
    "relink": {
        helptext: "relink\nrecreates all symlinks for dotfiles on the current platform",
        handler: async () => {
            let config;
            if (dotfile_repo_path != "") { // if specified via CLI arg, use that instead
                console.log(`Using CLI config: ${dotfile_repo_path}`);
                config = {
                    dotfile_repo_path: dotfile_repo_path
                };
            } else {
                console.log(`Using config file at ${configPath}`);
                config = await configuration.readAndFormatConfig(configPath);
            }

            const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(config.dotfile_repo_path);
            const filteredMarkers = markers.filter(m => dotfileMarkers.isDotfileLinkedOnCurrentPlatform(m));
            console.log("OPERATING ON:", filteredMarkers.map(m => m.name));
            for (const marker of filteredMarkers) {
                await dotfileMarkers.createSymlinkForDotfileMarker(marker);
            }
        }
    },
    "unlink": {
        helptext: "unlink\ndeletes all symlinks for dotfiles on the current platform",
        handler: async () => {
            let config;
            if (dotfile_repo_path != "") { // if specified via CLI arg, use that instead
                console.log(`Using CLI config: ${dotfile_repo_path}`);
                config = {
                    dotfile_repo_path: dotfile_repo_path
                };
            } else {
                console.log(`Using config file at ${configPath}`);
                config = await configuration.readAndFormatConfig(configPath);
            }

            const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(config.dotfile_repo_path);
            const filteredMarkers = markers.filter(m => dotfileMarkers.isDotfileLinkedOnCurrentPlatform(m));
            console.log("OPERATING ON:", filteredMarkers.map(m => m.name));
            for (const marker of filteredMarkers) {
                await dotfileMarkers.deleteSymlinkForDotfileMarker(marker);
            }
        }
    },
    "list": {
        helptext: "list\ndisplays all dotfiles in your repository that will be managed on the current platform",
        handler: async () => {
            let config;
            if (dotfile_repo_path != "") { // if specified via CLI arg, use that instead
                console.log(`Using CLI config: ${dotfile_repo_path}`);
                config = {
                    dotfile_repo_path: dotfile_repo_path
                };
            } else {
                console.log(`Using config file at ${configPath}`);
                config = await configuration.readAndFormatConfig(configPath);
            }

            const markers = await dotfileMarkers.getAllDotfileMarkersForRepository(config.dotfile_repo_path);
            const filteredMarkers = markers.filter(m => dotfileMarkers.isDotfileLinkedOnCurrentPlatform(m));

            console.log(`Dotfiles for ${PLATFORM}:\n`);
            for (const marker of filteredMarkers) {
                console.log(marker.name);
                console.log(`    Source:      ${dotfileMarkers.getRepoPathFromMarkerPath(marker)}`);
                console.log(`    Destination: ${dotfileMarkers.getLocationForCurrentPlatform(marker)}`);
                console.log();
            }
        }
    },
    "help": {
        helptext: "help\ndisplays this help message",
        handler: async () => {
            console.log(constructHelpText());
        }
    }
};

const constructHelpText = (): string => {
    let helpText = "bun-dotfile-manager\n\nAvailable commands:\n\n";

    for (const command in commandHandlers) {
        helpText += commandHandlers[command as CommandName].helptext + "\n\n";
    }

    return helpText.trimEnd();
};

try {
    if (!command) {
        console.error("Please provide a command.");
        await commandHandlers["help"].handler();
        process.exit(1);
    } else if (command in commandHandlers) {
        await commandHandlers[command as CommandName].handler();
    } else {
        console.error(`Unknown command: ${command}`);
        await commandHandlers["help"].handler();
        process.exit(1);
    }
} catch (err) {
    console.error(`There was an error while executing this command:\n${err}`);
    process.exit(1);
}
