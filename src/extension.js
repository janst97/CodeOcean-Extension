const path = require('path');
const vscode = require('vscode');

const {
	parseError,
	file_exists,
	copy_content,
	get_file_attributes,
	evaluate_assignment,
} = require('./utils');
const generateHtml = require('./webview');
const { SideViewProvider } = require('./sideview');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const provider = new SideViewProvider(context, performAssessment);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SideViewProvider.viewType, provider)
	);

	// Assess Assignment
	const eval_disposable = vscode.commands.registerCommand('codeocean.assess', async () => {
		performAssessment();
	})

	context.subscriptions.push(eval_disposable);
}

function deactivate() {}

let currentPanel;

async function performAssessment() { 
	const workspaceFolders = vscode.workspace.workspaceFolders;

	// Get the first workspace folder path
	const workspacePath = workspaceFolders[0].uri.fsPath;
	const coFilePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.co');

	const coFileExists = await file_exists(coFilePath);

	if (!coFileExists) {
		vscode.window.showErrorMessage('.co file does not exist in the workspace.');
		return;
	}

	const coFileContents = await copy_content(coFilePath);
	const contents = await get_file_attributes(coFileContents);

	// make sure the contents are not empty
	if (!contents) return;

	// Get the exercise file
	const exerciseFilePath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'Exercise.txt');
	const exerciseFileExists = await file_exists(exerciseFilePath);

	if (!exerciseFileExists) return;

	const exerciseContent = await copy_content(exerciseFilePath);

	const exerciseContents = exerciseContent.split('======================');
	
	const exercise = {
		title: exerciseContents[0],
		description: exerciseContents[1],
	}

	// Evaluate exercise
	const res = await evaluate_assignment(contents);

	// Show the results in a webview if the evaluation is successful
	if (!res) return;

	createOrShowWebview(res, exercise);
	vscode.window.showInformationMessage('Assessment done!');
}


function createOrShowWebview(res, exercise) {
	if (currentPanel) {
			// If a panel is already open, reveal it and update its content
			currentPanel.reveal(currentPanel.viewColumn, true); // Use `preserveFocus: true`
			currentPanel.webview.html = generateHtml(res, exercise);
	} else {
			// Create a new panel
			currentPanel = vscode.window.createWebviewPanel(
					'codeAssessment',
					'Assessment Results',
					vscode.ViewColumn.One,
					{ enableScripts: true }
			);

			currentPanel.webview.html = generateHtml(res, exercise);

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
