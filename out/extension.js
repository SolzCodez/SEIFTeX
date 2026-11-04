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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
async function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('seiftex.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from SEIFTeX!');
    });
    context.subscriptions.push(disposable);
    try {
        // Attempt to activate the HyperSnips extension and set up the snippets
        await setupSnippets(context);
        // Reload the HyperSnips created by the function upon extension start
        await vscode.commands.executeCommand('hsnips.reloadSnippets');
        // If there is an error, simply break and return that snippets could not be activated
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`SEIFTeX could not set up snippets: ${message}`);
    }
}
// Setup HyperSnips for the extension
async function setupSnippets(context) {
    const source = vscode.Uri.joinPath(context.extensionUri, 'snippets', 'latex.hsnips');
    const directory = vscode.Uri.joinPath(context.globalStorageUri, 'hsnips');
    const destination = vscode.Uri.joinPath(directory, 'latex.hsnips');
    const contents = await vscode.workspace.fs.readFile(source);
    await vscode.workspace.fs.createDirectory(directory);
    await vscode.workspace.fs.writeFile(destination, contents);
    const configuration = vscode.workspace.getConfiguration('hsnips');
    const currentPath = configuration.get('hsnipsPath');
    if (currentPath === directory.fsPath) {
        return;
    }
    // Ask to override HyperSnips latex.hsnips utilising the SEIFTeX snippets directory
    if (currentPath) {
        const choice = await vscode.window.showWarningMessage('SEIFTeX needs to change the HyperSnips directory. ' +
            'Snippets in your previous directory will no longer be loaded ' +
            'through this setting.', { modal: true }, 'Use SEIFTeX Snippets');
        if (choice !== 'Use SEIFTeX Snippets') {
            return;
        }
    }
    await configuration.update('hsnipsPath', directory.fsPath, vscode.ConfigurationTarget.Global);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map