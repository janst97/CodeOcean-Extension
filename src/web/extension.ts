// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
	file_exists,
	copy_content,
	get_assignment_info,
	evaluate_assignment,
	get_exercise_file,
	ExerciseInfo,
	CodeOceanTestResult,
} from './utils';

import { generateHtml } from './webview';
import { SideViewProvider } from './sideview';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new SideViewProvider(context, performAssessment);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SideViewProvider.viewType, provider)
	);

	// Assess Assignment
	const eval_disposable = vscode.commands.registerCommand('codeocean.assess', async () => {
		performAssessment();
	});

	context.subscriptions.push(eval_disposable);
}

let currentPanel : vscode.WebviewPanel|undefined;

async function performAssessment() {
	if(!vscode.workspace.workspaceFolders) {
		vscode.window.showErrorMessage("No workspace opened!");
		return;
	}
	const workspaceFolders = vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[];

	// Get the first workspace folder path
	const workspaceUri = workspaceFolders[0].uri;
	console.log(`Uri is: ${workspaceUri.fsPath}`);
	const coFilePath = vscode.Uri.joinPath(workspaceUri, '.co');

	const coFileExists = await file_exists(coFilePath);

	if (!coFileExists) {
		vscode.window.showErrorMessage('.co file does not exist in the workspace.');
		return;
	}

	const coFileContents = await copy_content(coFilePath);
	const contents = await get_assignment_info(coFileContents);

	// make sure the contents are not empty
	if (!contents) {
		vscode.window.showErrorMessage('Invalid .co file!');
		return;
	};

	// Get the exercise file
	const exerciseFilePath = await get_exercise_file(workspaceUri);

	if (exerciseFilePath === null) {
		vscode.window.showErrorMessage('Could not find exercise file!');
		return;
	};

	const exerciseContent = await copy_content(exerciseFilePath);

	const exerciseContents = exerciseContent.split('======================');

	const exercise = {
		title: exerciseContents[0],
		description: exerciseContents[1],
	};

	// Evaluate exercise
	const res = await evaluate_assignment(contents);

	// Show the results in a webview if the evaluation is successful
	if (!res) {
		return;
	};

	createOrShowWebview(res, exercise);
	vscode.window.showInformationMessage('Assessment done!');
}


function createOrShowWebview(res : [CodeOceanTestResult], exercise : ExerciseInfo) {
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

// This method is called when your extension is deactivated
export function deactivate() {}
