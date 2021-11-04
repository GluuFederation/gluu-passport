module.exports = profile => {
    return {
      uid: profile.sub,
      sub: profile.sub,
      locale: profile.locale
    }
  }
  