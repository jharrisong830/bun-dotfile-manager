import { parseArgs } from "util";

const argparse = (): { positionals: Array<string>, dotfile_repo: string } => {
    const { positionals, values: { dotfile_repo } } = parseArgs({
        options: {
            dotfile_repo: {
                type: "string",
                default: ""
            }
        },
        allowPositionals: true,
        strict: true
    });

    return { positionals, dotfile_repo };
};

export default argparse;