import { CodeOceanTestResult, ExerciseInfo, parseError } from "./utils";

export const generateHtml = (testResults : [CodeOceanTestResult], exercise : ExerciseInfo) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #1e1e1e;
                    color: #ffffff;
                    padding: 20px;
                }
                .container {
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 5px;
                    background-color: #2b2b2b;
                }
                .header {
                    font-size: 18px;
                    font-weight: bold;
                    padding: 10px;
                    border-radius: 3px;
                    margin-left: 0;
                    padding-left: 0;
                }
                .passed {
                    background-color: #4caf50;
                    border: 2px solid #4caf50;
                }
                .tried {
                    background-color: #FFDF00;
                    border: 2px solid #FFDF00;
                }
                .failed {
                    background-color: #f44336;
                    border: 2px solid #f44336;
                }
                .score-bar {
                    height: 20px;
                    border-radius: 5px;
                    margin-top: 10px;
                }
                .passed-bar {
                    background-color: #4caf50;
                }
                .failed-bar {
                    background-color: #f44336;
                }
            </style>
            <title>Assessment Results</title>
        </head>
        <body>
            <h1>Exercise (${exercise.title})</h1>
            <p>${exercise.description}</p></br>
            <h2>Assessment Results</h2>
            <div id="results">
                ${testResults.map(test => {
                    const scorePercentage = (test.score * 100).toFixed(2);
                    const isPassed = test.passed === test.count;
                    const isFailed = test.passed === 0;

                    return `
                    <div class="container">
                        <div class="header ${isPassed ? "passed" : isFailed ? "failed" : "tried"}">Test File (${test.filename})</div>
                        <p><strong>Passed Tests:</strong> ${test.passed} out of ${test.count}</p>
                        <p><strong>Score:</strong> ${test.passed} out of ${test.weight}</p>
                        <p><strong>Feedback:</strong> ${test.message}</p>
                        <p><strong>Error Messages:</strong> ${
                            test.failed > 0 ? test.error_messages.map((msg) => "<p>" + msg + "</p>").join(" ") : ""
                        }</p>
                        <p><strong>Score: ${scorePercentage}%</strong></p>
                        <div class="score-bar" style="width: ${scorePercentage}%;"></div>
                    </div>
                    `;
                }).join('')}
            </div>
        </body>
        </html>
    `;
};
