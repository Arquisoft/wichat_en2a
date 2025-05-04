Feature: Registering a new user

Scenario: The user is not registered in the site
  Given an unregistered user
  When I fill the data in the form and press submit
  Then The user is added

Scenario: Registering an already registered user
  Given a registered user
  When I fill the data in the form and press submit
  Then an error message appears

Scenario: The user is not registered and try to enter de web
  Given an unregistered user
  When I fill the data in the form and press submit
  Then an error message appears

Scenario: The user is registered and can login in
  Given a registered user
  When I fill the data in the form and press submit
  Then the home page show up