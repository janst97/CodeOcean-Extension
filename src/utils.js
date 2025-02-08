const axios = require('axios');
const vscode = require('vscode');


const parseError = (data) => {
  const separator = '----------------------------------------------------------------------';

  const testBlocks = data.split(separator);
  const parsedResults = testBlocks.map((block) => {
      const testMatch = block.match(/FAIL: (\S+) \((.+?)\)/);
      const descriptionMatch = block.match(/Test description: (.+?)\n/);
      const errorMatch = block.match(/AssertionError: (.+?)\n/);

      if (testMatch && descriptionMatch && errorMatch) {
          return {
              Test: `${testMatch[1]} (${testMatch[2]})`,
              TaskDescription: descriptionMatch[1].trim(),
              Error: errorMatch[1].trim()
          };
      }
      return null;
  }).filter(Boolean);

  return parsedResults;
}

const file_exists = async (filePath) => {
  try {
    await vscode.workspace.fs.stat(filePath);
    return true;
  } catch (error) {
    if (error.code === 'FileNotFound') {
      return false;
    }
    throw error;
  }
}

const get_file_attributes = async (coFileContents) => {
  const contents = coFileContents.split('\n');
  const contentsLength = contents.length - 1;

  let fileAttributes = {};

  try {
    // Loop through the .co file contents and get the file attributes
    for(let i = 2; i < contentsLength; i++) {
      const fileAttrIndex = i - 2;
      const exerciseFileAttr = contents[i].split('=');

      const fileName = exerciseFileAttr[0];
      const fileId = parseInt(exerciseFileAttr[1], 10);

      const workspaceFolders = vscode.workspace.workspaceFolders;
      const exerciseFilePath = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName);

      const exerciseFileExists = await file_exists(exerciseFilePath);

      // throw error is file doesn't exist
      if (!exerciseFileExists) throw new Error(`Exercise file ${fileName} not found.`);

      const exerciseContent = await copy_content(exerciseFilePath);

      fileAttributes[fileAttrIndex] = {
        'file_id': fileId,
        content: exerciseContent
      } 
    }

    return {
      fileAttributes,
      evaluationUrl: contents[1],
      validationToken: contents[0],
    }
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
    return null
  }
}

const copy_content = async (file) => {
  const fileContents = await vscode.workspace.fs.readFile(file);
  const decodedContent = Buffer.from(fileContents).toString('utf8');

  return decodedContent;
}

const evaluate_assignment = async (contents) => {
  const {
    evaluationUrl,
    fileAttributes,
    validationToken,
  } = contents;

  const headers = {
    'Content-Type': 'application/json'
  }

  const data = {
    "remote_evaluation": {
      "validation_token": validationToken,
      "files_attributes": fileAttributes,
    }
  }

  try {
    const response = await axios.post(evaluationUrl, data, { headers })

    return response.data;
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
    return null
  }
}

module.exports = {
  parseError,
  file_exists,
  copy_content,
  get_file_attributes,
  evaluate_assignment,
}
