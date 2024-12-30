const path = require('path');
const vscode = require('vscode');

const generateHtml = require('./webview');
const { get_file_contents, copy_exercise_content, evaluate_assignment } = require('./utils');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Assess Assignment
	const eval_disposable = vscode.commands.registerCommand('codeocean.assess', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		// Get the first workspace folder path
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const coFilePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.co');

    try {
			// Check if .co file exists
			await vscode.workspace.fs.stat(coFilePath);
			const contents = await get_file_contents(coFilePath);

			const exerciseFilePath = vscode.Uri.joinPath(workspaceFolders[0].uri, contents.exerciseFile);
			const exerciseContent = await copy_exercise_content(exerciseFilePath);

			// Evaluate exercise
			const res = await evaluate_assignment(contents, exerciseContent);

			// Show the results in a webview	
			createOrShowWebview(res);

			vscode.window.showInformationMessage('Assessment done!');
    } catch (error) {
			if (error.code === 'FileNotFound') {
					vscode.window.showWarningMessage('.co file does not exist in the workspace.');
			} else {
					vscode.window.showErrorMessage(`Error checking for .co file: ${error.message}`);
			}
    }
	})

	context.subscriptions.push(eval_disposable);
}

function deactivate() {}

let currentPanel;

function createOrShowWebview(res) {
	if (currentPanel) {
			// If a panel is already open, reveal it and update its content
			currentPanel.reveal(currentPanel.viewColumn, true); // Use `preserveFocus: true`
			currentPanel.webview.html = generateHtml(res);
	} else {
			// Create a new panel
			currentPanel = vscode.window.createWebviewPanel(
					'codeAssessment',
					'Assessment Results',
					vscode.ViewColumn.One,
					{ enableScripts: true }
			);

			currentPanel.webview.html = generateHtml(res);

			// Handle when the panel is closed
			currentPanel.onDidDispose(() => {
					currentPanel = undefined; // Reset the reference when closed
			});
	}
}

module.exports = {
	activate,
	deactivate
}
