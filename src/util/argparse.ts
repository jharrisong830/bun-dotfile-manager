import { parseArgs } from "util";

const argparse = (): Array<string> => {
    const { positionals } = parseArgs({
        allowPositionals: true,
        strict: true
    });

    return positionals;
};

export default argparse;