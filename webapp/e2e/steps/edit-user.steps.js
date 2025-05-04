const puppeteer = require('puppeteer');
const {defineFeature, loadFeature} = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions
const feature = loadFeature('./features/edit-user.feature');

let page;
let browser;

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']})
            : await puppeteer.launch({headless: false, slowMo: 100});
        page = await browser.newPage();
        //Way of setting up the timeout
        setDefaultOptions({timeout: 100000})
        await page.setViewport({width: 1920, height: 1080});

        await page
            .goto("http://localhost:3000", {
                waitUntil: "networkidle0",
            })
    });

    afterAll(async () => {
        browser.close()
    });

    test('A logged user wants to edit his profile', ({given, when, then}) => {
        given('A logged user', async () => {
            let username = "test6";
            let password = "test6";
            await expect(page).toClick("button", {text: "Don't have an account? Register here."});
            await expect(page).toFill('input[name="username"]', username);
            await expect(page).toFill('input[name="password"]', password);
            await expect(page).toClick('button', {text: 'Register'})
            await expect(page).toFill('input[name="username"]', username);
            await expect(page).toFill('input[name="password"]', password);
            await expect(page).toClick('button', {text: 'Login'})
        });

        when('Clicking on avatar icon', async () => {
            await page.waitForSelector('[data-testid="edit-user-button"]');
            await page.click('[data-testid="edit-user-button"]');
        });

        then('A page for editing his avatar is opened', async () => {
            await expect(page.url()).toContain('/editUser');
        });
    });
});