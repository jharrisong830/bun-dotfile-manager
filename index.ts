import configuration from "./src/util/configuration";
import argparse from "./src/util/argparse";
import buildInfo from "./src/util/build";
import find from "./src/fs/find";

const args = argparse();
const command = args[0];

switch (command) {
    case "init":
        const doesExist = await configuration.doesConfigExist();
        if (doesExist) {
            // TODO: warn here
        }
        await configuration.initializeConfigFile();
        break;
    case "get-config":
        console.log(await configuration.readAndFormatConfig());
        break;
    case "set-config":
        const dotfileRepoPath = args[1];
        if (!dotfileRepoPath) {
            console.error("Please provide a path for 'set-config' command.");
            process.exit(1);
        }
        await configuration.setAndFormatConfig(dotfileRepoPath);
        break;
    case "version":
        console.log(`bun-dotfile-manager version ${buildInfo.version}\nbuilt on ${buildInfo.buildTime} from ${buildInfo.commitHash}\nfor platform ${buildInfo.platform}`);
        break;
    case "test":
        const config = await configuration.readAndFormatConfig();
        console.log(await find.findAllDotfileMarkers(config.dotfile_repo_path));
        break;
    default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
}
