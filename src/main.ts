import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

async function run(): Promise<void> {
  try {
    const githubRepo = process.env['GITHUB_REPOSITORY'];
    if (!githubRepo) throw new Error('No GITHUB_REPOSITORY');

    const [repoOwner, repoName] = githubRepo.split('/');
    var repoWorkSpace: string | undefined = process.env['GITHUB_WORKSPACE'];
    const token = process.env['ACCIO_ASGMNT_ACTION_TOKEN'];
    const ACCIO_API_ENDPOINT = process.env['ACCIOJOB_BACKEND_URL'];

    if (!token) throw new Error('No token given!');
    if (!repoWorkSpace) throw new Error('No GITHUB_WORKSPACE');
    if (repoOwner !== 'acciojob') throw new Error('Error not under acciojob');
    if (!repoName) throw new Error('Failed to parse repoName');

    let studentUserName = '';
    let assignmentName = '';

    const contextPayload = github.context.payload;

    if (contextPayload.pusher.username) {
      if (repoName.includes(contextPayload.pusher.username)) {
        const indexOfStudentName = repoName.indexOf(
          contextPayload.pusher.username
        );
        studentUserName = repoName.substring(indexOfStudentName);
        assignmentName = repoName.substring(0, indexOfStudentName - 1);
      }
    } else if (repoName.includes(contextPayload.pusher.name)) {
      const indexOfStudentName = repoName.indexOf(contextPayload.pusher.name);
      studentUserName = repoName.substring(indexOfStudentName);
      assignmentName = repoName.substring(0, indexOfStudentName - 1);
    }

    if (assignmentName && studentUserName) {
      const questionTypeQuery = new URLSearchParams();

      questionTypeQuery.append('templateName', assignmentName);
      const questionTypeData = await axios.get(
        `${ACCIO_API_ENDPOINT}/github/get-question-type?${questionTypeQuery.toString()}`
      );
      const questionTypeContent = questionTypeData.data.questionType;
      core.setOutput('questionType', questionTypeContent);
      process.exit(0);
      
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    process.stderr.write(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

run();
