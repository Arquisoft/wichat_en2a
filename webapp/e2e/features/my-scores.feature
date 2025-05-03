Feature: Seeing my scores

  Scenario: A logged user wants to see his scores
    Given A logged user
    When Clicking on my scores
    Then His scores are displayed