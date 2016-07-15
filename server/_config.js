var ids = {
  github: {
    clientID: '7719rof6v75s4g',
    clientSecret: 'fM4ACEGDCVaYdNfg',
    callbackURL: "https://192.168.200.67:8000/auth/github/callback"
  },
  linkedin: {
    clientID: '7719rof6v75s4g',
    clientSecret: 'fM4ACEGDCVaYdNfg',
    callbackURL: "https://192.168.200.67:8000/auth/linkedin/callback"
  },
  twitter: {
    consumerKey: 'iObC2FyT9385PweLYRXMoGvrF',
    consumerSecret: 'ROgNGXq1k6fAY9sWFI0hyEGYHHiwbzEk11Lkjs3Pc7LZFID8Cp',
    callbackURL: "https://192.168.200.67:8000/auth/twitter/callback"
  },
  facebook: {
    clientID: '1082456341840678',
    clientSecret: '1790a63ec214dc086feec3be2a2e0b82',
    callbackURL: "https://192.168.200.67:8000/auth/facebook/callback"
  },
  tumblr: {
    consumerKey: 'VlgkvmTCPPA1iwvoi5Ey5Py5y4odGruJV6SH17SjuPBcvNYtvS',
    consumerSecret: 'BS9AsDtIdp8ZfSrxy5nxxOMpBIcExqTK1xdZH5xAu4FCuqbQKW',
    callbackURL: "https://192.168.200.67:8000/auth/tumblr/callback"
  },
  yahoo: {
    consumerKey: 'VlgkvmTCPPA1iwvoi5Ey5Py5y4odGruJV6SH17SjuPBcvNYtvS',
    consumerSecret: 'BS9AsDtIdp8ZfSrxy5nxxOMpBIcExqTK1xdZH5xAu4FCuqbQKW',
    returnURL: "https://192.168.200.67:8000/auth/yahoo/callback"
  },
  google: {
    consumerKey:'528871124361-n08g7ap1sda52rjbegrg6qh2nu23es0c.apps.googleusercontent.com',
    consumerSecret:'s0rk7lfP2vDG1-mmHf2oq1GU',
     returnURL: "https://192.168.200.67:8000/auth/google/callback"
  },
  windowslive:{
    clientID:'528871124361-n08g7ap1sda52rjbegrg6qh2nu23es0c.apps.googleusercontent.com',
    clientSecret:'s0rk7lfP2vDG1-mmHf2oq1GU',
    callbackURL: "https://192.168.200.67:8000/auth/windowslive/callback"
  },
  dropbox: {
    consumerKey: 'ZUghSAL4QOPXCYpk5Y1SZjnKH',
    consumerSecret: 'tBGcbOwQOyl4vOcUSiSIK1NKXRoerrnCp5Jhs77rUB23w73ZDe',
    callbackURL: "https://192.168.200.67:8000/auth/dropbox/callback"
  },
  serverURI: "192.168.200.67",
  serverWebPort: 8000,
  applicationEndpoint: "https://gluu.local.org/oxauth/auth/twitter/twitterpostlogin.htm",
  applicationSecretKey: "GluuNodeServerSocialLogin1234567890"
};

module.exports = ids;