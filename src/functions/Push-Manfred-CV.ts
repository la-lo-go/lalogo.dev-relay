import dotenv = require("dotenv");
import path = require("path");
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { cleanMnfObject } from "../Objects/cleanObjects";
import { MyOctokit } from "../Common/MyOctikit";
import {
  CleanJson,
  ConvertToLocalFile,
  GetModifiedFilesByExtension,
} from "../Common/Utils";

dotenv.config();

const OWNER = process.env.OWNER!;
const MANFREDREPO = process.env.MANFRED_REPO!;
const MAINREPO = process.env.MAIN_REPO!;
const NEWMANFREDDATAPATH = process.env.NEW_MANFRED_DATA_PATH!;

app.http("Push-Manfred-CV", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: PushManfredCV,
});

// handle the github webhook request
export async function PushManfredCV(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url} "`);

  const body = request.body;

  if (!body) {
    return {
      status: 404,
      body: "No body provided",
    };
  }

  if (request.headers.get("X-GitHub-Event") !== "push") {
    return {
      status: 204,
      body: "Not a push event",
    };
  }

  await handlePostRequest(request);
}

async function handlePostRequest(req: HttpRequest) {
  const payload: any = await req.json();

  switch (payload.repository.name) {
    case MANFREDREPO:
      await handleManfredRepo(payload);
      break;
    default:
      return {
        status: 200,
        body: "No action required for this repo"
      };
  }
}

async function handleManfredRepo(payload: any) {
  const modifiedJsons = GetModifiedFilesByExtension(
    payload.head_commit.modified,
    "json"
  );
  if (modifiedJsons.length === 0) {
    return {
      status: 200,
      body: "No JSON modified files",
    };
  }

  await handleUpdatedJsons(modifiedJsons, NEWMANFREDDATAPATH);
  return {
    status: 200,
    body: "Updated files",
  };
}

async function handleUpdatedJsons(files: string[], newDataPath: string) {
  for (const originalPath of files) {
    const response = await MyOctokit.GetGitFile(
      OWNER,
      MANFREDREPO,
      originalPath
    );

    if ((response.data.length = 0)) {
      console.log(`File not found: ${originalPath}`);
      continue;
    }

    const fileContent = Buffer.from(response.data.content, "base64").toString(
      "utf-8"
    );

    const cleanMnfJson = CleanJson(fileContent, cleanMnfObject);

    // Just for local debugging, comment it later for production
    // ConvertToLocalFile(cleanMnfJson, originalPath);

    // Make sure that Windows doesn't break the path on GitHub
    const pushPath = path.join(newDataPath, originalPath).replace(/\\/g, "/");

    await MyOctokit.PushFile(OWNER, MAINREPO, pushPath, cleanMnfJson)
  }
}
