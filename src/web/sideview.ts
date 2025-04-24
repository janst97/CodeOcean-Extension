import * as vscode from 'vscode';

export class SideViewProvider {
  static viewType = 'myView';
  context: vscode.ExtensionContext;
  performAssessment: Function;

  constructor(context: vscode.ExtensionContext, performAssessment: Function) {
    this.context = context;
    this.performAssessment = performAssessment;
  }

  resolveWebviewView(webviewView : vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.html = this.getHtmlContent();

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'assess') {
        this.performAssessment(); // Call performAssessment directly
      }
    });
  }

  getHtmlContent() {
    return `
      <html>
      <body style="display: flex; justify-content: center; align-items: center">
        <button style="cursor: pointer; background-color: orange; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 5px;">
          Assess Exercise
        </button>
        <script>
          const vscode = acquireVsCodeApi();
          document.querySelector("button").addEventListener("click", () => {
            vscode.postMessage({ command: 'assess' });
          });
        </script>
      </body>
      </html>`;
  }
}
