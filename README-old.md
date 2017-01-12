# Passport.js 

## OVERVIEW

Passport is authentication middleware for Node.js. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application. Including Passport.js in the Gluu Server will allow an admin to offer many authentication strategies to end users, including social login at large consumer IDPs like Google, Facebook, etc.

## INSTALLATION

Node-Passport server requires npm and NodeJS to be installed on the system.

For installing node and npm please refer to [this guide](https://nodejs.org/en/download/package-manager/).

Clone the repository and move to server directory and hit:

`npm install`

This will install all the dependencies of the server. To start the server move to the server directory and hit

`node app`

## SETUP Passport.js with Gluu

During installation of the Gluu Server select `yes` to install Passport.js when prompted.

After Gluu Server installation, enable Passport.js by logging in to oxTrust and navigating to Configuration > Organization Configuration.

Enable Passport.js support and click the update button to save the settings.

Then go to Manage Custom Scripts and:

    1. Enable passport script in Person Authentication Tab.
    2. Enable uma authorization policy in uma authorization policy tab.

You can set the strategies from Configuration > Manage Authentication > Passport Authentication Method

And then add the strategy details like clientID and clientSecret.

The values for Strategy field for common providers are:
- google for GPlus Authentication
- twitter for Twitter Authentication
- linkedin for LinkedIn Authentication
- github for Github Authentication
- facebook for Facebook Authentication

Make sure the  Authorized redirect URIs list of your app contains the passport strategy's callback.
If your gluu server points to https://example.gluu.org and the strategy is facebook, the list of Authorized redirect URIs should contain https://example.gluu.org/passport/auth/facebook/callback.

Add the strategies that are required and then click update to save the configuration.

Finally, to display the strategies on your login page navigate to Configuration > Manage Authentication > Default Authentication Method
and then select passport as the default authentication mode. 

Click update.

Restart Gluu server. 

And you're all done.

## GOALS

- To create Node-Passport server which will provide social network authentication APIs for Gluu server.
- To create Gluu server interception scripts for authentication of users which will consume Node-Passport server api.


## SPECIFICATIONS

Node-Passport server authenticates users for all the social networks like: google+, facebook, twitter etc. Node-Passport uses passport authentication middleware for social network authentication. All the node js api are secured with JWT(JSON Web Token) so that all the requests to node js server are authenticated and can be trusted by the application.

Gluu server has only one interception script for all the social network providers which will call node js server for authenticating users to respective social network provider. The users will be added to Gluu server if the user does not present in the LDAP server of Gluu and if user does not exists then user will be added to server.

## Sequence Diagram:

![Sequence Diagram](sequence _diagram.png "Title")

1. Gluu server calls Node-Passport server for JWT token.
2. Node-Passport server generates a JWT token and provides it in response to Gluu server.
3. Gluu server requests Node-Passport server with JWT token to authenticate user for a social network provider.
4. Node-Passport server will redirect user to social media authentication provider.
5. After successful authentication of user, social network will callback Node-Passport server along with user details and access token.
6. Node-Passport server will redirect user back to Gluu server with user details and access token.
7. Gluu server’s interception script will check if the user exists in LDAP server and if user exists then user will be logged into the system and if not, then it will create new user with the required details and logs user into the system.


## JWT:

JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with HMAC algorithm) or a public/private key pair using RSA.

JSON Web Tokens consist of three parts separated by dots (.), which are:
- Header
- Payload
- Signature

Therefore, a JWT typically looks like the following.
xxxxx.yyyyy.zzzzz

All the three parts are then Base64Url encoded to form JSON Web Token.

The output is three Base64 strings separated by dots that can be easily passed in HTML and HTTP environments, while being more compact compared to XML-based standards such as SAML.

The following shows a JWT that has the previous header and payload encoded, and it is signed with a secret.

If you want to play with JWT and put these concepts to practice, you can use jwt.io Debugger to decode, verify and generate JWTs.


## Example of encoded and decoded JWT

![JWT](jwt.png "Title")

Whenever the user wants to access a protected route or resource, it should send the JWT, here in our case in route url. Therefore the route or api call should look like the following.

https://urltorouteorresource/JWT

This is a stateless authentication mechanism as the user state is never saved in the server memory. The server's protected routes will check for a valid JWT in the API parameter, and if there is a valid token, the user will be allowed.


## What data will be persist?

All the data that are received from the social network like name, email etc will be stored. If all the required details for creating a user are not available from the social network then user will be asked to enter all the required details. Currently email is the only required field.


## How Node-Passport server will fit in Gluu server?

During the installation of Gluu server we can setup node server as well. We can create a vagrant script to set up whole Node-Passport environment.


## How does Gluu server specify which passport strategy it wants?

There will be single page for the authentication with different buttons which will call different endpoints on Node-Passport server. For example twitter button will call the twitter strategy of Node-Passport server for twitter authentication.

## How to create a new app to use for Passport server?

Every provider has different protocols and ways to create the app. We will look at one of the most common providers "facebook" and create a new app.

1. Login to https://developers.facebook.com
2. Click on Add a new App from My Apps dropdown
3. Fill the required details and click the create Create App ID button to create the app.
4. Click on the dashboard menu and get the clientID and clientSecret which can be used with the passport.
5. Click on settings menu and put the domain of your gluu server in the App Domains field.

Note: If there is a filed for Authorized redirect URIs, make sure the Authorized redirect URIs list of your app contains the passport strategy's callback. If your gluu server points to https://example.gluu.org and the strategy is facebook, the list of Authorized redirect URIs should contain https://example.gluu.org/passport/auth/facebook/callback.

## How to add new strategies to Passport server?

Find an npm module that fits best for the strategy that you want to add.
Let's start with an example. In this example we will consider adding facebook strategy.

1. If you want to add facebook strategy, search for passport-facebook npm module where you can select the npm module and then add the module to passport server.
2. Let's say we found this module "passport-facebook" and want to use this module in for facebook authentication, install the module in passport app by executing ```npm install passport-facebook --save``` to install the module and also save the dependency to the passport server.
3. Configure the strategy.
4. Configure routes for the strategy.
5. Call method to configure the strategy
6. Add button for the configured strategy in passport authentication UI.

##### 3. Configure the strategy.

All the strategies are been configured in the folder server/auth/*.js.
We need to create new file named with the strategy name. Our strategy is facebook so we can create new file named facebook.js and configure the strategy.

```javascript
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = global.applicationHost.concat("/passport/auth/facebook/callback");
    passport.use(new FacebookStrategy({
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
            callbackURL: callbackURL,
            enableProof: true,
            profileFields: ['id', 'name', 'displayName', 'email']
        },
        function(accessToken, refreshToken, profile, done) {
            var userProfile = {
                id: profile._json.id,
                name: profile.displayName,
                username: profile.username || profile._json.id,
                email: profile._json.email,
                givenName: profile._json.first_name,
                familyName: profile._json.last_name,
                provider: profile.provider,
                accessToken: accessToken
            };
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
```
Here is an example of the facebook strategy configured. For facebook the required parameters are clientID, clientSecret and callbackURL. You can search for more configurations depending on the requirements and configure accordingly.

The function setCredentials is used to configure the strategy of the credentials of this strategy are been received. The parameter credentials holds the values that are stored in the oxTrust

The parameter callbackURL should point to the callback route that we will configure in step 4. As we are configuring facebook strategy, the callbackURL can be set to ```"/passport/auth/facebook/callback"``` according the the convention of the app. You can customise the callbackURL but it is recommended not to change the convention.

The callback function has different number of parameters and data in those parameters which are required to be mapped to the userProfile keys which are ```id, name, username, email, givenName, familyName, provider, accessToken```. Here id and provider params are must. Provider param holds the value of the provider, i.e for facebook the provider value will be facebook etc. In most cases the value of provider is received in the user claims itself.

Then export the strategy that we configured and also the setCredentials method which will be used to set the details of the strategy.

##### 4. Configure routes for the strategy

We are going to set the routes for the strategy that we are going to configure.
First require the strategy that we configured in the previous step.

```javascript
var passportFacebook = require('../auth/facebook').passport;
```

Here ```require('../auth/facebook').passport``` will include the passport strategy that we have configured.

Then add the routes for the strategy. First we are going to register the callback route and then the authenticate route.

The authenticate route first validated the jwt token that is been sent by Gluu server to passport server. If the JWT is valid then the user is redirected to the strategy and user can be authenticated there and the response of the user authentication is redirected to callback route.

If the callback routes receives the user data then user is been redirected to Gluu.

```javascript
//==================== facebook ================
router.get('/auth/facebook/callback',
    passportFacebook.authenticate('facebook', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/facebook/:token',
    validateToken,
    passportFacebook.authenticate('facebook', {
        scope: ['email']
    }));
```

scope value can be set from the strategy itself it it supports that or you can set the scope value here too.

The callbackResponse method return the control to Gluu server and user is been enrolled in the system.

##### 5. Call method to configure the strategy

In this step we are going to call the setCredentials method of the strategy that we have created.

Go to the file configureStrategies.js in auth folder of passport server and require the strategy that we have created.

```javascript
var FacebookStrategy = require('./facebook');
```

And then in setConfiguratins function, call the setCredentials method if the strategy data is received.

```javascript
//FacebookStrategy
if (data.passportStrategies.facebook) {
	logger.log('info', 'Facebook Strategy details received');
	logger.sendMQMessage('info: Facebook Strategy details received');
	FacebookStrategy.setCredentials(data.passportStrategies.facebook);
}
```

This will configure the passport strategy if the details of the strategy are received from passport API.

##### 6. Add button for the configured strategy in passport authentication UI.

So far the passport server is ready with the new strategy that we have created, but to call the strategy we need to add a button which calls the new strategy.

```xhtml
<a data-p="facebook" class="provider" href="javascript:void(0);" style="height:40px; width:120px">
	<img alt="facebook" src="img/facebook.png" style="height:40px; width:40px"></img>
</a>
```

Here the data-p and class="provider" are required to call the strategy. the data-p attribute should hold the value of the route that we created in routes.


```javascript
//==================== facebook ================
router.get('/auth/facebook/callback',
    passportFacebook.authenticate('facebook', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/facebook/:token',
    validateToken,
    passportFacebook.authenticate('facebook', {
        scope: ['email']
    }));
```

In order to call the Strategy, the request URL to call the API must match the route that we configured.
