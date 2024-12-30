const axios = require('axios');
const vscode = require('vscode');

const get_file_contents = async (filePath) => {
  const fileContents = await vscode.workspace.fs.readFile(filePath);
  const decodedContent = Buffer.from(fileContents).toString('utf8');

  const contents = decodedContent.split('\n');
  const exerciseFileAttr = contents[2].split('=');

  return {
    evaluationUrl: contents[1],
    validationToken: contents[0],
    exerciseFile: exerciseFileAttr[0],
    fileId: parseInt(exerciseFileAttr[1], 10),
  }
}

const copy_exercise_content = async (exerciseFile) => {
  const fileContents = await vscode.workspace.fs.readFile(exerciseFile);
  const decodedContent = Buffer.from(fileContents).toString('utf8');

  return decodedContent;
}

const evaluate_assignment = async (contents, exerciseContent) => {
  const {
    fileId,
    evaluationUrl,
    validationToken,
  } = contents;

  // console.log(contents);

  const headers = {
    'Content-Type': 'application/json'
  }

  const data = {
    "remote_evaluation": {
      "validation_token": validationToken,
      "files_attributes": {
        "0": {
          "file_id": fileId,
          "content": exerciseContent
        }
      }
    }
  }

  try {
    const response = await axios.post(evaluationUrl, data, { headers })

    // console.log(response.data[0]);
    return response.data;
  } catch (error) {
    console.error('Error fetching the page:', error.message);
    return null
  }
}

module.exports = { get_file_contents, copy_exercise_content, evaluate_assignment, }
