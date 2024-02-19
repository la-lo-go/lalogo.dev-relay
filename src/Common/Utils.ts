import path = require("path");
import fs = require("fs");

export function GetModifiedFilesByExtension(
  modifiedFiles: string[],
  extension: string
) {
  return modifiedFiles.filter((file: string) => file.endsWith(`.${extension}`));
}

export function CleanJson(
  fileContent: string,
  cleanObjectSctructure: Object
): string {
  const parsedContent = JSON.parse(fileContent);

  for (const key in parsedContent) {
    if (!cleanObjectSctructure.hasOwnProperty(key)) {
      delete parsedContent[key as keyof typeof parsedContent];
    }
  }

  return JSON.stringify(parsedContent, null, 2);
}

export function ConvertToLocalFile(fileContent: string, filePath: string): string {
  const localFilePath = path.join("Clean", filePath);
  console.log(localFilePath);

  fs.writeFileSync(localFilePath, fileContent);

  return localFilePath;
}
