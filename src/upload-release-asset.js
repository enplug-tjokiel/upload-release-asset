const core = require('@actions/core');
const { GitHub } = require('@actions/github');
const fs = require('fs');
import {findFilesToUpload} from 'shared/search';

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput('upload_url', { required: true });
    const assetPath = core.getInput('asset_path', { required: true });
    const assetName = core.getInput('asset_name', { required: false });
    const assetContentType = core.getInput('asset_content_type', { required: true });

    const searchResult = await findFilesToUpload(filePath);

    if (searchResult.filesToUpload.length === 0) {
      core.setFailed("No files found with this pattern");
    } else {
      const s = searchResult.filesToUpload.length === 1 ? '' : 's';
      core.info(
        `With the provided path, there will be ${searchResult.filesToUpload.length} file${s} uploaded`
      )
      core.debug(`Root artifact directory is ${searchResult.rootDirectory}`)



      const headers = { 'content-type': assetContentType };

      // Upload a release asset
      // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
      // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
      for (var i = 0; i < searchResult.filesToUpload.length; i++) {
        const assetPathLocal = searchResult.filesToUpload[i];
        const assetNameLocal = assetPathLocal.replace(/^.*[\\/]/, '');
        core.info(`Uploading ${assetPathLocal} wit file name ${assetNameLocal}`);

        const uploadAssetResponse = await github.repos.uploadReleaseAsset({
          url: uploadUrl,
          headers,
          name: assetNameLocal,
          file: fs.readFileSync(assetPathLocal)
        });
      }
    }
    // // Determine content-length for header to upload asset
    // const contentLength = filePath => fs.statSync(filePath).size;
    //
    // // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
    // // const headers = { 'content-type': assetContentType, 'content-length': contentLength(assetPath) };
    // const headers = { 'content-type': assetContentType };
    //
    // // Upload a release asset
    // // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
    // // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
    // const uploadAssetResponse = await github.repos.uploadReleaseAsset({
    //   url: uploadUrl,
    //   headers,
    //   name: assetName,
    //   file: fs.readFileSync(assetPath)
    // });

    // Get the browser_download_url for the uploaded release asset from the response
    // const {
    //   data: { browser_download_url: browserDownloadUrl }
    // } = uploadAssetResponse;

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    //core.setOutput('browser_download_url', browserDownloadUrl);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
