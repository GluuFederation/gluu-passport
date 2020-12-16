Feature: Rate limiting

  Application should control the number of request comes and 
  special against the DOC(denial-of-service) attack

  # Issue: https://github.com/GluuFederation/gluu-passport/issues/139
  
  @RateLimiting
  Scenario Outline: Application should limit the request
    Given rate limit is <rateLimitMax> in <rateLimitWindowMs>
    When "<endpoint>" is requested <requestsCount> times in less then <rateLimitMax> by the same client
    Then last request response should have status code <responseStatusCode>
      And response body should be "<responseBody>"

    Examples:
    | rateLimitMax   | rateLimitWindowMs | endpoint      | requestsCount  | responseStatusCode | responseBody                                                         |
    | 100            | 10000             | /health-check | 101            | 429                | "You have exceeded the 100 requests in 86400000 milliseconds limit!" |
    | 100            | 20000             | /token        | 101            | 429                | "You have exceeded the 100 requests in 86400000 milliseconds limit!" |
    | 100            | 10000             | /health-check | 99             | 200                | '{"message":"Cool!!!"}'                                              |

