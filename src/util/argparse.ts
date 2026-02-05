import { parseArgs } from "util";

const argparse = (): { positionals: Array<string>, dotfile_repo_path: string } => {
    const { positionals, values: { dotfile_repo_path } } = parseArgs({
        options: {
            dotfile_repo_path: {
                type: "string",
                default: ""
            }
        },
        allowPositionals: true,
        strict: true
    });

    return { positionals, dotfile_repo_path };
};

export default argparse;