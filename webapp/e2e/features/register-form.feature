Feature: Registering a new user

Scenario: The user is not registered in the site
  Given An unregistered user
  When I fill the data in the form and press submit
  Then A confirmation message should be shown in the screen



Feature: Registering a new user

Scenario: The username is registeres in the site
  Given an un registered user
  When I fill the data in the form and press submit 
  Then a error message should appear



Feature: Logging in the web

Scenario: The user is not registered
  Given an unregistered user
  When i fill the data and press submit
  Then an error message should appear



Feature: Logging in the web

Scenario: The user is registered
  Given a registered user
  When i fill the data and press submit
  Then the user enter in the main page of the web

