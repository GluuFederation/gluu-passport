Feature: Rate limiting

  Application should control the number of request comes and 
  special against the DOC(denial-of-service) attack

  # Issue: https://github.com/GluuFederation/gluu-passport/issues/139
  
  @RateLimiting
  Scenario: Application should limit the request
    Given endpoint requested 100 times by the same client
    When endpoint is requested one more times
    Then response status code should be 429
        And response body shoulb be "You have exceeded the 100 requests in 86400000 milliseconds limit!"
