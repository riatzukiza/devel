import { Octokit } from "@octokit/rest";
import { bus } from "./events.js";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function listIssues(repo: string) {
  const [owner, repoName] = repo.split("/");
  const { data } = await octokit.issues.listForRepo({
    owner, repo: repoName, state: "open", per_page: 50
  });
  return data.map(i => ({
    id: i.id, number: i.number, title: i.title, state: i.state
  }));
}

export async function listPRs(repo: string) {
  const [owner, repoName] = repo.split("/");
  const { data } = await octokit.pulls.list({
    owner, repo: repoName, state: "open", per_page: 50
  });
  return data.map(p => ({
    id: p.id, number: p.number, title: p.title, state: p.state
  }));
}

export async function openPR(repo: string, issueNumber: number, branch: string) {
  const [owner, repoName] = repo.split("/");
  const title = `Fix #${issueNumber}`;
  const head = branch;
  const base = "dev";
  const { data } = await octokit.pulls.create({ owner, repo: repoName, title, head, base });
  bus.emit({ type: ":pr/opened", data: { number: data.number, url: data.html_url }});
  return data;
}

export async function commentPR(repo: string, pr: number, body: string) {
  const [owner, repoName] = repo.split("/");
  const { data } = await octokit.issues.createComment({
    owner, repo: repoName, issue_number: pr, body
  });
  bus.emit({ type: ":pr/commented", data: { pr, id: data.id }});
  return data;
}

export async function getIssueDetail(repo: string, issueNumber: number) {
  const [owner, repoName] = repo.split("/");
  const { data: issue } = await octokit.issues.get({
    owner, repo: repoName, issue_number: issueNumber
  });
  
  const { data: comments } = await octokit.issues.listComments({
    owner, repo: repoName, issue_number: issueNumber
  });
  
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    body: issue.body,
    created_at: issue.created_at,
    user: {
      login: issue.user?.login
    },
    comments: comments.map(c => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user: {
        login: c.user?.login
      }
    }))
  };
}

export async function getPRDetail(repo: string, prNumber: number) {
  const [owner, repoName] = repo.split("/");
  const { data: pr } = await octokit.pulls.get({
    owner, repo: repoName, pull_number: prNumber
  });
  
  const { data: files } = await octokit.pulls.listFiles({
    owner, repo: repoName, pull_number: prNumber
  });
  
  const { data: comments } = await octokit.issues.listComments({
    owner, repo: repoName, issue_number: prNumber
  });
  
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state: pr.state,
    body: pr.body,
    created_at: pr.created_at,
    user: {
      login: pr.user?.login
    },
    head: {
      ref: pr.head?.ref
    },
    base: {
      ref: pr.base?.ref
    },
    files: files.map(f => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions
    })),
    comments: comments.map(c => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user: {
        login: c.user?.login
      }
    }))
  };
}