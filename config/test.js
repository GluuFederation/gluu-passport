const saltFile = './test/testdata/salt'

// data of passportFile
const passportConfig = {
    "configurationEndpoint": "https://gluu.test.local.org/identity/restv1/passport/config",
    "failureRedirectUrl": "https://gluu.test.local.org/oxauth/auth/passport/passportlogin.htm",
    "logLevel": "debug",
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
        "spTLSCert": "/tmp/passport-sp.crt",
        "spTLSKey": "/tmp/passport-sp.key",
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

// passport certs /tmp/passport-rp.pem
const passportRPPEM = `-----BEGIN RSA PRIVATE KEY-----
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

const passportSPCert = `-----BEGIN CERTIFICATE-----
MIIDVTCCAj0CFE8iisHuNSXCM2dPS286ATdyV712MA0GCSqGSIb3DQEBCwUAMGcx
CzAJBgNVBAYTAklOMQswCQYDVQQIDAJJTjELMAkGA1UEBwwCSU4xDTALBgNVBAoM
BEdsdXUxEjAQBgNVBAMMCWxvY2FsaG9zdDEbMBkGCSqGSIb3DQEJARYMbWVnQGds
dXUub3JnMB4XDTIwMDcxNjA5NDgwNloXDTIxMDcxNjA5NDgwNlowZzELMAkGA1UE
BhMCSU4xCzAJBgNVBAgMAklOMQswCQYDVQQHDAJJTjENMAsGA1UECgwER2x1dTES
MBAGA1UEAwwJbG9jYWxob3N0MRswGQYJKoZIhvcNAQkBFgxtZWdAZ2x1dS5vcmcw
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDBbwLJl3zydvBvBArAD1wu
EwEhomITnL2aK+nVCOe64ySw6ZxStNuHlYtSI7q8mP/cUTDcfY/6BgsWprF73GVt
vAeYAtK6e4Kt187Cy0WeDiE2/dHEc5FBoxN72Nz4LohEvf2YwNzlZDCE04MDz/Lx
OyCiVol9b52KdJ3vfv0MnxzgR9XKvryx7kxtvUUpuA/TLcEkgsdR15l9hP8N5MhN
emu+KsBGH8wh5JaOmFFZoA+6+lpy1fj6djPI8SRJueRqDhJIBB0hF5JnW1sRTePy
Dyx3oJV5nnx9+M55diL/yKSAjZ8StIqIeBhhyZ56Ox3WOVoin0QvUMph+b9HVW7J
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAAsx6yHfiZbiu3JfVi5eYslGnI5G431C
cBeOyagXzgkPhkYOEiBOgXakVd7CRIbjmIhsy4s4JTBGG+8uTyMwVNtmqx+6l4JS
lmnqeT69WrkWB3y5LC/ueyC5YqmOtdUjPOdbum2zSp0HxLRgHhMpMEujMr03oMH7
ShcPwmrLVgv+oPkfDaXcVzthaCLRae2kZNhNxHMD5Yw0QspaUg7a4/IdH7cO1ybz
VCZCougQ3yo8rtCwDR7hpubzu67NA4t/KIViFlc0+5AqBRF8BX+3cOkxraPy7edf
B9rP6Qyuy8jtQRrZShrdOavcWXCf4+s37WuqmFNuxvgL6jNE2dANrcc=
-----END CERTIFICATE-----`;

const passportSPKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAwW8CyZd88nbwbwQKwA9cLhMBIaJiE5y9mivp1QjnuuMksOmc
UrTbh5WLUiO6vJj/3FEw3H2P+gYLFqaxe9xlbbwHmALSunuCrdfOwstFng4hNv3R
xHORQaMTe9jc+C6IRL39mMDc5WQwhNODA8/y8TsgolaJfW+dinSd7379DJ8c4EfV
yr68se5Mbb1FKbgP0y3BJILHUdeZfYT/DeTITXprvirARh/MIeSWjphRWaAPuvpa
ctX4+nYzyPEkSbnkag4SSAQdIReSZ1tbEU3j8g8sd6CVeZ58ffjOeXYi/8ikgI2f
ErSKiHgYYcmeejsd1jlaIp9EL1DKYfm/R1VuyQIDAQABAoIBAQC5mCrjg99VwPsm
eYlbCCHY71EZlXVm/fAJ2fKM/fNhpIlS2YKs9GziZYD8ud11EZQFLz2jgTJAocXH
4P7QKgKDzHK4zpSkatdSt4rh6imM4l/KJLU9Oel4QeDy5nv2AKes1WJaS0pnKr9G
4q6FXOPrw2CngkJ/QTW2X/gdkAl6LhFgh2TX9a2GgHH5imSo1f8W+bzSmGRBkpWN
zZJM7nGtzZqevsPH+uKAarxdXrwlhSd1ymMKWb5bjghOXC10QZHJd81Rd9kjWUb1
iCFvbpv4X+jnjJWeKMFhQK9FDPDDowhQVGk+hhQcyq7wkMWTfP44wbQLvfgAScjv
j0iTJyqVAoGBAOPThaq69oXCk3Tdbswnxqs7ZaJsFRlSIqbyuBQ8RtqHmTGAF8kf
ZzYIBwr5K0teVGD2rMNZfI4WHc+FYoLlbMzsNc8Qm3ODISp4Ua81TlWIUUJbIOjt
RYLNdzYgQZ+i75IBeG3qcTAdZq4+paIvMwyA67xBM6DU7MDTucE0IArHAoGBANla
sayhMLxz5oOj8cVj4oA4VWQOLL++yt/SQeC5bEQa/q5ILmcu3mwEGIiTHO/h2G+M
ul5rzLwmzC9N6pU5sB+C+/nQ5VLiPyxMwpWlC5bNx4iXqYZsMzJYEVN5KLMGlqvl
pzw19yNZDtWl5VmM9C9rltJKh7nqHuMr0OfZQqnvAoGBAMcTx0Jn+xDo9JbzA2VM
AJMR5P6nuUwV9Iezoly0SymbwaZ6is5JLZQOMbFKB6XlOJA+HLra0DcMZmI26Nz+
gzMR2PcmSOAIHowQ9TfHubqN0ovMO5at9saUqe3XA+DtrLAFrulFKkDkAByUS4HM
AqyTXupygx2v0W2x1ShZVwJzAoGAfMl/HHdmvatk+ssTMZqJHcg57jndIzDs1Neo
Dtcl+2vsMC8sxPy5ohYv56legbKOSmznSvJlFtjHfZkkRwxZu52+AM0X/B/82Pgw
9y1MnAYEur0oDQ7tzceWGvCCl1X/By3Qd9cbzmWBCNQ3+tPcFaWVb6JujiSGGzK6
u4GWrm0CgYEA4rrEcJFu3jKAc+LCwhu/xigYTm8OuwZhDhrsJB7ZjecxoAdju14O
LyStL8Od76Y8E4oVfTE+uZn6W0LdEZHTV+Z6TxD/IJx+z/nvWVwZT5qUNkyRdu2U
KPadE6PceCzMIC4iSv/JEPKCiA69Pxy7BWgxBIsicWu9elXmKK3ZYe0=
-----END RSA PRIVATE KEY-----`;

module.exports = {
	saltFile,
	passportConfig,
    passportConfigResponse,
    passportRPPEM,
    passportSPCert,
    passportSPKey,
}