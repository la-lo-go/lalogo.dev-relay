import dotenv = require("dotenv");
import { Octokit } from "@octokit/rest";

dotenv.config();

const OWNER = process.env.OWNER!;

const USERINFO = {
  name: OWNER,
  email: process.env.AUTHOR_EMAIL!,
};

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN!,
});

export class MyOctokit {
  static async GetGitFile(
    owner: string,
    repo: string,
    path: string
  ): Promise<any> {
    return await octokit.request(
      `GET /repos/${owner}/${repo}/contents/${path}`,
      {
        owner: owner,
        repo: repo,
        path: path,
      }
    );
  }

  static async PushFile(
    owner: string,
    repo: string,
    path: string,
    fileContent: string
  ): Promise<void> {
    const base64Content = Buffer.from(fileContent).toString("base64");

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: owner,
        repo: repo,
        path: path,
        message: `[BOT] Commit updated ${path}`,
        content: base64Content,
        committer: { ...USERINFO },
        author: { ...USERINFO },
        sha: await this.GetGitFileSha(owner, repo, path),
      });
    } catch (error) {
      console.log(`Error pushing file ${path}: ${error}`);
    }
  }

  static async GetGitFileSha(
    owner: string,
    repo: string,
    path: string
  ): Promise<string | undefined> {
    try {
      const response = await this.GetGitFile(owner, repo, path);
      return response.data.sha;
    } catch (error) {
      // if the file doesn't exist
      return undefined;
    }
  }
}
