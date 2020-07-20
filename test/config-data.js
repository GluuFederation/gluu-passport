// data of passportFile
const passportConfig = {
    "configurationEndpoint": "https://gluu.test.local.org/identity/restv1/passport/config",
    "failureRedirectUrl": "https://gluu.test.local.org/oxauth/auth/passport/passportlogin.htm",
    "logLevel": "info",
    "consoleLogOnly": false,
    "clientId": "1502.3fe76d0a-38dd-4f91-830b-e33fd70d778a",
    "keyPath": "/tmp/passport-rp.pem",
    "keyId": "fbc267ef-0705-4b3a-8c80-bf70e75cf08b_sig_rs512",
    "keyAlg": "RS512"
};

// response of .../identity/restv1/passport/config
// add more data as per test case require
const passportConfigResponse = {
    "conf": {
        "serverURI": "https://gluu.test.local.org",
        "serverWebPort": 8990,
        "postProfileEndpoint": "https://gluu.test.local.org/oxauth/postlogin.htm",
        "spTLSCert": "/etc/certs/passport-sp.crt",
        "spTLSKey": "/etc/certs/passport-sp.key",
        "logging": {
            "level": "info",
            "consoleLogOnly": false,
            "activeMQConf": {
                "enabled": false,
                "host": "",
                "username": "",
                "password": "",
                "port": 0
            }
        }
    },
    "idpInitiated": {
        "openidclient": {
            "authorizationEndpoint": "https://gluu.test.local.org/oxauth/restv1/authorize",
            "clientId": "1503.6a319ccf-c801-4fd8-a11a-a9e0c8e92322",
            "acrValues": "passport_saml"
        },
        "authorizationParams": []
    },
    "providers": [{
        "id": "cedev6",
        "displayName": "ce-dev6-passport",
        "type": "openidconnect",
        "mapping": "openidconnect-default",
        "passportStrategyId": "passport-openidconnect",
        "enabled": true,
        "callbackUrl": "https://gluu.test.local.org/passport/auth/cedev6/callback",
        "requestForEmail": false,
        "emailLinkingSafe": false,
        "options": {
            "userInfoURL": "https://gluu.test.ce6.local.org/oxauth/restv1/userinfo",
            "clientID": "b4e0f241-a8c1-4c75-8fc8-4ae7163e9695",
            "tokenURL": "https://gluu.test.ce6.local.org/oxauth/restv1/token",
            "authorizationURL": "https://gluu.test.ce6.local.org/oxauth/restv1/authorize",
            "scope": "[\"openid\", \"email\", \"profile\"]",
            "clientSecret": "Admin1Admin!",
            "issuer": "https://gluu.test.ce6.local.org"
        }
    }]
};

// passport certs
const passportPEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKLes42c4Twd5K
OykgvZvBLOcJ6124YX97EIp/I9GMUMNPKxOpK3cxCCt7RBe82K1+rbiW6ZO+UwlA
f3/SrCilHDsryr0y35pBj1FyXDcQ7TKMD79urxJ6dV2vIOJgneFzXW1LDQrGWxuz
QVryfGgcLoH7VJEO9AbWx/xPrccUCUqNqHzEnfmC9ej/KljIsNvg1JQIrXsxFztG
h2tPpMhFNMhuXlQDXWzLD2RQBr4+jOkqtRAEgbemri+4bq1s2NJYj7qkD0XNtFlH
PT093SmI0rWZ5xzsJPuLeqDPMFau6wj0Ow864uKzMGRZLYkSJWXjBVBTJ8luh+qt
iGgNYhpnAgMBAAECggEAWyM46f8wyLI3SKIDh6lBOWLK4StSq4dzxl9t9yMH1mcf
q6Pg8HzR9W3X3/CRfMT17GlWEN1JBt36iTMQRUDq74ba24JAKFsod44p6lHMVtp9
0ypUIopT25TlfsjlkyUIWI9Qcaj25vRx96up2i4fZjjGyitUWnfBT3eF8ssEtzAs
kSY5aAikVTsHn+a2ZwixIT3PSD1J7jUwkfYg+vZPiIhf5siyzo0t+vtqHg3k75y3
UmbdrW1DCGFezTKAReL5t/y+OTL2vaN+dZIaWP8ZUCaC8i2mC/YklaILoEULEom9
hGMgzDbsNaRdoTTGuZBn+uTAlO7TPXj8E9xadjODsQKBgQD/GwKiY6sK8+E+TYFS
rnyPVnR+gTyQ3A3iOQkN6cbGb1McfkH2+0dSqz1/uAkk1y6vxsSMMZgerl30spH5
iA68jwuPAFXLDZxTJsfslACbOxn2F/+/0NBTOyjzPxr1DLZp0hWSmspzg9b7BBXk
jOOGVroHK/J27fI0jio/8u4fNwKBgQDK42aNHFbuxJqxVRRkD18iqBBUxPKzfiGr
YdQlGy1JpupYqmVohjDdeAbYyqYgKANuomljmUdlu+yr17GzVNhMx1U6TDbr6XlM
JczMVQORzEc5n8S+PvCZ4QXW+ylScCABhkU+hFMzL0Hznq9NXDQWCLK0Q/y2qOCa
N3iwBECWUQKBgQDZLzKv8/Cjs3u5Ih0OulR7Z9xn8zkQDviW933Y5YWAXTjB0k/w
qH9RR05lVNYcEkLCDZQ50uMyg7qj3/9dFNOO/q2VgnCIHb9QH30n0d0uS0PP+yCW
On2RzpUPelNF+xu1vdD17mibrcuyCwlkefoe3ekkv+p+DBgfXEVmCjlmQwKBgEiD
/qNw/aFZo/C9+AvLcrVwXGXv/s8oxd/7l1er3wP0JM6MGLLDQ7Pkso3J4JadtpxU
cFao8lvqTy0cauct7CGFHXE4zGiFilUtLYXa3Ou/l7WA5VEaLeTSCMROAPb2HHpv
A1DU+ufQfEIW9ZEw42z8ruK/ahPfSGfWa8x9uJgBAoGBAIOk47iR0WyANOAbBnpO
y+L/CV3KgfjSjnLNax/zxrhhK7h2qwAuR6DcJezg1ugE21Os2CAmH5qgg4xbZuNP
2MWd83wdhB9pncsmTV+yZhr+Kn3RqVufiqm4LfL5dV0YUcUdr0BVLiw8IkRuH15B
yn1QSd+71PbT+sSXOjGIaF/3
-----END RSA PRIVATE KEY-----`;

module.exports = {
    passportConfig,
    passportConfigResponse,
    passportPEM, 
}