Feature: Rate limiting

  Application should control the number of request comes and 
  special against the DOC(denial-of-service) attack

  # Issue: https://github.com/GluuFederation/gluu-passport/issues/139
  
  Scenario Outline: Application should limit the request according to configuration file setup
    Given configured rate limit is 100 requests in 86400000 ms
    When "<endpoint>" is requested <requestsCount> times in less then 86400000 ms by the same client
    Then last request response should have status code <responseStatusCode>
      And response body should be "<responseBody>"

    Examples:
    | endpoint      | requestsCount  | responseStatusCode | responseBody                                                         |
    | /health-check | 101            | 429                | "You have exceeded the 100 requests in 86400000 milliseconds limit!" |
    | /health-check | 99             | 200                | '{"message":"Cool!!!"}'                                              |
    | /token        | 101            | 429                | "You have exceeded the 100 requests in 86400000 milliseconds limit!" |
    | /health-check | 50             | 200                | '{"message":"Cool!!!"}'                                              |
    | /health-check | 60             | 200               | '{"message":"Cool!!!"}'                                              |

