import { readdir, readFile } from "node:fs/promises";
import { Script } from "node:vm";

const directory = new URL("../snippets/source/", import.meta.url);
const files = (await readdir(directory))
    .filter(file => file.endsWith(".hsnips"))
    .sort();

let errors = 0;

function check(code, file, line) {
    try {
        new Script(code, {
            filename: file,
            lineOffset: line - 1,
        });
    } catch (error) {
        errors++;
        console.error(`\nJavaScript error in ${file}, near line ${line}:`);
        console.error(error.stack);
    }
}

for (const file of files) {
    const content = await readFile(new URL(file, directory), "utf8");

    // Check shared JavaScript blocks.
    const globalPattern = /^global[ \t]*\r?\n([\s\S]*?)^endglobal[ \t]*\r?$/gm;

    for (const match of content.matchAll(globalPattern)) {
        const start = match.index + match[0].indexOf("\n") + 1;
        const line = content.slice(0, start).split("\n").length;

        check(match[1], file, line);
    }

    // Check JavaScript inside double-backtick interpolation blocks.
    const interpolationPattern = /``([\s\S]*?)``/g;

    for (const match of content.matchAll(interpolationPattern)) {
        const line = content.slice(0, match.index).split("\n").length;

        check(match[1], file, line);
    }
}

if (errors > 0) {
    console.error(`\nFound ${errors} JavaScript syntax error(s).`);
    process.exitCode = 1;
} else {
    console.log("Source JavaScript syntax checks passed.");
}