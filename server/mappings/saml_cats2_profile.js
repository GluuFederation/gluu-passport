module.exports = profile => {
    return {
            uid: profile.nameID,
            issuer: profile.issuer,
            persistentId: profile.spNameQualifier+'|'+profile.nameQualifier+'|'+profile.nameID,
            sessionIndex: profile.sessionIndex,
            authnInstant: profile.getAssertion().Assertion.AuthnStatement[0].$.AuthnInstant
    }
}
