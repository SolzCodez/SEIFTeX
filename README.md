### Swift Editing and Integration For .TeX (SEIFTeX)
Lightweight LaTeX snippets and visualisation for VS Code

> **Status:** Planning / pre-MVP.

See `CS193/Eisenhower Matrix.pdf` for current scope.

### Snippets
Documentation of the custom snippets within this extension will be updated below.

## Required setup
Users are recommended to have downloaded a LaTeX compiler such as `TeX Live`, but this is not required.
If a user does not have a LaTeX compiler downloaded on their machine, `Tectonic.exe` compiler will be downloaded automatically for the extension
There is minimal setup required for this extension, aside from understanding its custom snippets and usage.
That said, a baseline understanding of how LaTeX works is recommended.

## Additional setup:
# Setting placeholder navigation precedence over autocomplete.
There is a common grievance regarding tabbing through placeholders and accidentally autocompleting a separate function through Visual Studio Code.
If you want to fix this, set the precedence to placeholder navigation within a LaTeX file:
Open the command palette (`ctrl+shift+p`), and navigate to `Preferences: Open Keyboard Shortcuts (JSON)`
Within this JSON, paste the following code within the square brackets:
```json
{
    "key": "tab",
    "command": "jumpToNextSnippetPlaceholder",
    "when": "editorTextFocus && editorLangId == latex && inSnippetMode && hasNextTabstop"
},
{
    "key": "shift+tab",
    "command": "jumpToPrevSnippetPlaceholder",
    "when": "editorTextFocus && editorLangId == latex && inSnippetMode && hasPrevTabstop"
}
```
With the above said, it is a personal preference whether you want to change the placeholder navigation precedence.

## Change log:
- Set up extension boilerplate code via `yo code`
- Integrated HyperSnips as a dependency for the extension
- Created a custom latex.hsnips file within the snippets folder
- Ensured that upon extension run, the HyperSnips directory's latex.hsnips was overwritten by the SEIFTeX latex.hsnips file
- HyperSnips extension reload to commit changes to the snippet integration
- Integrated Tectonic compiler within the extension to auto-download for users without a compiler preinstalled
- Add a plethora of mathematical snippets to the library
- Split up the snippet development into separate files for ease of access and debugging.
- Updated snippets to be regex-smart and allow dynamic snippet adjustments.
