const { abortOnThrow } = require("./utils/http-helpers");
const { sign, verify } = require("jsonwebtoken");
const fetch = require("node-fetch");
const { SESSION_LENGTH } = require("./utils/config");
const Octokit = require("@octokit/rest");

exports.handler = abortOnThrow(async event => {
  const { code, state } = event.queryStringParameters;
  if (!code) {
    return {
      statusCode: 400,
      body: "Code missing from callback"
    };
  }

  try {
    verify(state, process.env.SURMBLOG_SECRET);
  } catch (e) {
    return {
      statusCode: 400,
      body: "Bad state"
    };
  }

  const authParams = {
    client_id: process.env.SURMBLOG_GITHUB_APP_ID,
    client_secret: process.env.SURMBLOG_GITHUB_APP_SECRET,
    code
  };

  const body = JSON.stringify(authParams);
  const resp = await fetch(`https://github.com/login/oauth/access_token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": body.length
    },
    body
  });
  if (!resp.ok) {
    return {
      statusCode: 400,
      body: `Could not get access token: ${resp.status}`
    };
  }
  const token = await resp.json();
  const { token_type, access_token } = token;

  const octokit = new Octokit({
    auth: `${token_type} ${access_token}`,
    userAgent: "SurmBlog"
  });
  const { data: repoData } = await octokit.repos.get({
    owner: "surma",
    repo: "surma.github.io"
  });

  if (!repoData.permissions.admin && !repoData.permissions.push) {
    return {
      statusCode: 403,
      body: "No write access to the repository"
    };
  }

  const jwt = sign(token, process.env.SURMBLOG_SECRET, {
    expiresIn: SESSION_LENGTH
  });

  return {
    statusCode: 307,
    headers: {
      Location: `/admin?${new URLSearchParams({ token: jwt })}`
    },
    body: ""
  };
});
