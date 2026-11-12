"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompiler = registerCompiler;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
// Convert Node's callback-based execFile into an async function.
//
// execFile runs an executable directly, without constructing a shell
// command from a document path.
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
// Register everything needed for the bundled compiler.
//
// extension.ts calls this once from activate().
function registerCompiler(context) {
    // Compiler output will appear in:
    // View → Output → SEIFTeX Compiler
    const output = vscode.window.createOutputChannel('SEIFTeX Compiler');
    // First milestone: allow one build at a time.
    //
    // Later, compile-on-save should queue a follow-up build instead of
    // simply ignoring a request made while a build is running.
    let compiling = false;
    async function compileActiveDocument() {
        // Even a compiler bundled with our extension reads and executes
        // instructions from the user's project.
        //
        // Do not build documents in an untrusted workspace.
        if (!vscode.workspace.isTrusted) {
            void vscode.window.showWarningMessage('Trust this workspace before compiling LaTeX.');
            return;
        }
        // This package currently contains only a Windows x64 executable.
        //
        // Check the extension host's platform, not the user's desktop UI.
        if (process.platform !== 'win32' ||
            process.arch !== 'x64') {
            void vscode.window.showErrorMessage('This SEIFTeX build supports Windows x64 only.');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            void vscode.window.showWarningMessage('Open a saved .tex file first.');
            return;
        }
        const document = editor.document;
        // Reject untitled documents and non-file document providers.
        //
        // The compiler needs a real file path in its own environment.
        if (document.uri.scheme !== 'file' ||
            !document.uri.fsPath.toLowerCase().endsWith('.tex')) {
            void vscode.window.showWarningMessage('Open a saved .tex file first.');
            return;
        }
        if (compiling) {
            void vscode.window.showInformationMessage('SEIFTeX is already compiling a document.');
            return;
        }
        compiling = true;
        try {
            // Compile the saved contents, not an outdated file on disk.
            if (document.isDirty) {
                const saved = await document.save();
                if (!saved) {
                    throw new Error('The document could not be saved.');
                }
            }
            // Resolve the executable relative to the installed extension.
            //
            // This works both while debugging and after installing a VSIX,
            // provided the bin directory is included in the package.
            const executable = vscode.Uri.joinPath(context.extensionUri, 'bin', 'win32-x64', 'tectonic.exe').fsPath;
            // Produce a clear error if the binary was not prepared or was
            // accidentally excluded from the extension package.
            try {
                await fs.access(executable);
            }
            catch {
                throw new Error('The bundled Tectonic executable is missing. ' +
                    'Expected location: ' +
                    executable);
            }
            // Absolute path to the LaTeX source file.
            // Example: C:\Assignments\Homework1\main.tex
            const source = document.uri.fsPath;
            // Keep the source directory as the compiler's working directory.
            //
            // This is separate from the output directory: changing where outputs
            // go should not change the working directory used for the project.
            const directory = path.dirname(source);
            // Store generated files in a .texbuild folder beside the source.
            //
            // Example: C:\Assignments\Homework1\.texbuild
            const buildDirectory = path.join(directory, '.texbuild');
            // Ensure the output directory exists before starting Tectonic.
            //
            // recursive: true means this succeeds even if the directory
            // already exists.
            await fs.mkdir(buildDirectory, { recursive: true });
            // Determine the PDF filename from the source filename.
            //
            // main.tex     → .texbuild/main.pdf
            // homework.tex → .texbuild/homework.pdf
            const pdfPath = path.join(buildDirectory, path.basename(source, path.extname(source)) + '.pdf');
            output.clear();
            output.appendLine(`Compiler: ${executable}`);
            output.appendLine(`Source: ${source}`);
            output.appendLine(`Working directory: ${directory}`);
            output.appendLine('');
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'SEIFTeX: Compiling LaTeX',
                cancellable: false
            }, async () => {
                try {
                    const result = await execFileAsync(executable, [
                        '-X',
                        'compile',
                        // Disable Tectonic's known-insecure features.
                        // This is an additional precaution, not a full sandbox.
                        '--untrusted',
                        // Keep the log to help diagnose document errors.
                        '--keep-logs',
                        // Request source/PDF synchronization data for a
                        // future preview integration.
                        '--synctex',
                        // Write output beside the source document.
                        '--outdir',
                        buildDirectory,
                        // Pass the source path as a separate argument.
                        source
                    ], {
                        // Relative project paths resolve from the source folder.
                        cwd: directory,
                        // Avoid opening an extra console window on Windows.
                        windowsHide: true,
                        // Allow extra time for first-run support-file downloads.
                        // This is a basic timeout, not a cancellation feature.
                        timeout: 300_000,
                        // Limit captured compiler output.
                        maxBuffer: 10 * 1024 * 1024
                    });
                    // Record both streams because useful diagnostics may
                    // appear on either one.
                    output.append(result.stdout);
                    output.append(result.stderr);
                }
                catch (error) {
                    // execFile includes captured output on process failures.
                    // Preserve it before showing the shorter error notification.
                    const failure = error;
                    output.append(failure.stdout ?? '');
                    output.append(failure.stderr ?? '');
                    throw error;
                }
            });
            // Confirm that the expected output is present.
            await fs.access(pdfPath);
            output.appendLine('');
            output.appendLine(`Build completed: ${pdfPath}`);
            // Show exactly where the generated files will be written.
            output.appendLine(`Output directory: ${buildDirectory}`);
            void vscode.window.showInformationMessage('SEIFTeX: Compilation finished. The PDF is in .texbuild.');
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : String(error);
            output.appendLine('');
            output.appendLine(`Build failed: ${message}`);
            output.show(true);
            void vscode.window.showErrorMessage('SEIFTeX compilation failed. See the SEIFTeX Compiler output.');
        }
        finally {
            // Unlock future builds whether this one succeeds or fails.
            compiling = false;
        }
    }
    context.subscriptions.push(
    // Automatically clean up the output channel on extension unload.
    output, 
    // This identifier must match the command in package.json.
    vscode.commands.registerCommand('seiftex.compile', compileActiveDocument));
}
//# sourceMappingURL=compiler.js.map