import { readFile, writeFile } from "node:fs/promises";

const sourceDirectory = new URL(
    "../snippets/source/",
    import.meta.url
);

const outputFile = new URL(
    "../snippets/latex.hsnips",
    import.meta.url
);

const files = [
    "globals.hsnips",
    "environments.hsnips",
    "basics.hsnips",
    "fractions.hsnips",
    "derivatives.hsnips",
    "vectors.hsnips",
    "matrices.hsnips",
    "greek.hsnips",
    "logic.hsnips",
];

const sections = [];

for (const file of files) {
    const content = await readFile(
        new URL(file, sourceDirectory),
        "utf8"
    );

    sections.push(content.trim());
}

const header = [
    "# Generated file. Do not edit directly.",
    "# Edit snippets/source/ and run npm run build:snippets.",
].join("\n");

await writeFile(
    outputFile,
    header + "\n\n" + sections.join("\n\n\n") + "\n",
    "utf8"
);

console.log("Built snippets/latex.hsnips");