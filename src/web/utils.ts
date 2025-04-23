import { Uri } from "vscode";

const vscode = require('vscode');
var Buffer = require('buffer/').Buffer;

interface AssignmentInfo {
  evaluationUrl : string,
  fileAttributes : Map<number, FileAttribute>,
  validationToken : string
}

interface FileAttribute {
  file_id: number,
  content: string
}

interface RemoteEvaluationType {
  validation_token: string,
  files_attributes: Map<number, FileAttribute>
}

interface CodeOceanEvalRequest {
  remote_evaluation : RemoteEvaluationType;
}

interface ParseError {
  Test : string,
  TaskDescription : string,
  Error : string
}

interface DownloadResponse {
  id: number,
  files: [],
  render_url: [any],
}

export const parseError = (data : string) : (ParseError | null)[] => {
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
};

export const file_exists = async (filePath : Uri) : Promise<boolean> => {
  try {
    await vscode.workspace.fs.stat(filePath);
    return true;
  } catch (error : any) {
    if (error.code === 'FileNotFound') {
      return false;
    }
    throw error;
  }
};

export const get_assignment_info = async (coFileContents : string) : Promise<AssignmentInfo | null> => {
  const contents = coFileContents.split('\n');
  const contentsLength = contents.length - 1;

  let fileAttributes = new Map<number, FileAttribute>();

  try {
    // Loop through the .co file contents and get the file attributes
    for (let i = 2; i < contentsLength; i++) {
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

      fileAttributes.set(fileAttrIndex, {
        'file_id': fileId,
        content: exerciseContent
      });
    }

    return {
      fileAttributes,
      evaluationUrl: contents[1],
      validationToken: contents[0],
    }
  } catch (error : any) {
    vscode.window.showErrorMessage(error.message);
    return null;
  }
};

export const copy_content = async (file : Uri) : Promise<string> => {
  const fileContents = await vscode.workspace.fs.readFile(file);
  const decodedContent = Buffer.from(fileContents).toString('utf8');

  return decodedContent;
};

export const evaluate_assignment = async (contents : AssignmentInfo) : Promise<any> => {
  const {
    evaluationUrl,
    fileAttributes,
    validationToken,
  } = contents;

  const data = {
    "remote_evaluation": {
      "validation_token": validationToken,
      "files_attributes": fileAttributes,
    }
  };

  // https://stackoverflow.com/questions/48969495/in-javascript-how-do-i-should-i-use-async-await-with-xmlhttprequest
  return sendEvalPostRequest(evaluationUrl, data);
};

const sendEvalPostRequest = (url : string, data : CodeOceanEvalRequest) : Promise<string> => {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.responseType = "json";
    xhr.onerror = (error) => {
      vscode.window.showErrorMessage(error);
      reject(null);
    };
    xhr.onload = () => {
      if (xhr.status === 201) {
          try {
            let jsonResponse = JSON.parse(xhr.response);
            resolve(jsonResponse);
          } catch (_e) {
            vscode.window.showErrorMessage("Unexpected response from CodeOcean!");
            reject(null);
          }
      } else {
        vscode.window.showErrorMessage("Unexpected HTTP return code!");
        reject(null);
      }
    };
    xhr.send(JSON.stringify(data));
  });
};
