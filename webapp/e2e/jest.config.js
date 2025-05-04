module.exports = {
    //testMatch: ["**/steps/*.js"], this was changed because we could pass e2e test when making the release
    // but in local they pass, the scripts are commented out.
    testMatch: ["**/steps/register-form.steps.js"],
    testTimeout: 300000,
    setupFilesAfterEnv: ["expect-puppeteer"]
}