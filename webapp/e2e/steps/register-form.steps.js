const puppeteer = require('puppeteer');
const { defineFeature, loadFeature }=require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions
const feature = loadFeature('./features/register-form.feature');

let page;
let browser;

defineFeature(feature, test => {
  
  beforeAll(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']})
      : await puppeteer.launch({ headless: false, slowMo: 100 });
    page = await browser.newPage();
    //Way of setting up the timeout
    setDefaultOptions({ timeout: 10000 })

    await page
      .goto("http://localhost:3000", {
        waitUntil: "networkidle0",
      })
      .catch(() => {});
  });

  test('The user is not registered in the site', ({given,when,then}) => {
    
    let username;
    let password;

    given('An unregistered user', async () => {
      username = "pablo"
      password = "pabloasw"
      await expect(page).toClick("button", { text: "Don't have an account? Register here." });
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await expect(page).toClick('button', { text: 'Add User' })
    });

    then('The user is added', async () => {
      await page.goto('http://localhost:3000/login');
        
    });
  })

  test('Registering an already registered user', ({given,when,then}) => {
    
    let username;
    let password;

    given('a registered user', async () => {
      username = "pablo"
      password = "pabloasw"
      await expect(page).toClick("button", { text: "Don't have an account? Register here." });
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await expect(page).toClick('button', { text: 'Add User' })
    });

    then('an error message appears', async () => {
      await expect(page).toMatchElement("div", { text: "Error: Username already exists" });
      await page.goto('http://localhost:3000/login');
    });
  })

  test('The user is not registered and try to enter de web', ({given,when,then}) => {
    let username;
    let password;

    given('an unregistered user', async () => {
      username = "pa"
      password = "pabl"
      
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await expect(page).toClick('button', { text: 'Login' })
    });

    then('an error message appears', async () => {
      await expect(page).toMatchElement("div");
      await page.goto('http://localhost:3000/login');
    });
  })

  test('The user is registered and can login in', ({given,when,then}) => {
    let username;
    let password;

    given('a registered user', async () => {
      username = "pablo"
      password = "pablo"
      
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await expect(page).toClick('button', { text: 'Login' })
    });

    then('the home page show up', async () => {
      
    });
  })

  afterAll(async ()=>{
    browser.close()
  })

});