import { readFile, writeFile } from "node:fs/promises";
import { Script } from "node:vm";

const sourceDirectory = new URL("../snippets/source/", import.meta.url);
const outputFile = new URL("../snippets/latex.hsnips", import.meta.url);
const files = [
    "globals.hsnips",
    "environments.hsnips",
    "basics.hsnips",
    "fractions.hsnips",
    "derivatives.hsnips",
    "vectors.hsnips",
    "matrices.hsnips",
    "greek.hsnips",
    "logic.hsnips"
];

const sections = [];
const triggers = new Set();
const globals = [];

for (const file of files) {
    const content = (await readFile(new URL(file, sourceDirectory), "utf8")).trim();
    const starts = (content.match(/^snippet /gm) || []).length;
    const ends = (content.match(/^endsnippet[ \t]*\r?$/gm) || []).length;
    if (starts !== ends) throw new Error(`${file}: mismatched snippet blocks`);

    for (const match of content.matchAll(/^global[ \t]*\r?\n([\s\S]*?)^endglobal[ \t]*\r?$/gm)) {
        new Script(match[1], { filename: file });
        globals.push(match[1]);
    }

    for (const match of content.matchAll(/``([\s\S]*?)``/g)) {
        new Script(match[1], { filename: file });
    }

    for (const match of content.matchAll(/^snippet (`[^`]+`|\S+) "/gm)) {
        const trigger = match[1];
        if (triggers.has(trigger)) {
            throw new Error(`${file}: duplicate trigger ${trigger}`);
        }
        triggers.add(trigger);
        if (trigger.startsWith("`")) new RegExp(trigger.slice(1, -1));
    }

    sections.push(`# Source: ${file}\n\n${content}`);
}

if (globals.length !== 1) {
    throw new Error(`Expected one global block, found ${globals.length}`);
}
new Script(globals.join("\n"), { filename: "combined-globals" });

const header = "# Generated file. Do not edit directly.\n"
    + "# Edit snippets/source/ and run npm run build:snippets.";
await writeFile(outputFile, header + "\n\n" + sections.join("\n\n") + "\n", "utf8");
console.log(`Built latex.hsnips: ${files.length} files, ${triggers.size} snippets.`);
