// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Our own compiler module, located beside extension.ts.
import { registerCompiler } from './compiler';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Registers the compile command and its output channel.
  registerCompiler(context);

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
    await vscode.commands.executeCommand(
      'hsnips.reloadSnippets'
    );
	
	// If there is an error, simply break and return that snippets could not be activated
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    vscode.window.showErrorMessage(
      `SEIFTeX could not set up snippets: ${message}`
    );
  }
}

// Setup HyperSnips for the extension
async function setupSnippets(context: vscode.ExtensionContext): Promise<void> {
  const source = vscode.Uri.joinPath(
    context.extensionUri,
    'snippets',
    'latex.hsnips'
  );

  const directory = vscode.Uri.joinPath(
    context.globalStorageUri,
    'hsnips'
  );

  const destination = vscode.Uri.joinPath(
    directory,
    'latex.hsnips'
  );

  const contents = await vscode.workspace.fs.readFile(source);

  await vscode.workspace.fs.createDirectory(directory);

  await vscode.workspace.fs.writeFile(destination, contents);

  const configuration = vscode.workspace.getConfiguration('hsnips');

  const currentPath = configuration.get<string>('hsnipsPath');

  if (currentPath === directory.fsPath) {
    return;
  }

	// Ask to override HyperSnips latex.hsnips utilising the SEIFTeX snippets directory
  if (currentPath) {
    const choice = await vscode.window.showWarningMessage(
      'SEIFTeX needs to change the HyperSnips directory. ' +
        'Snippets in your previous directory will no longer be loaded ' +
        'through this setting.',
      { modal: true },
      'Use SEIFTeX Snippets'
    );

    if (choice !== 'Use SEIFTeX Snippets') {
      return;
    }
  }

  await configuration.update(
    'hsnipsPath',
    directory.fsPath,
    vscode.ConfigurationTarget.Global
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
