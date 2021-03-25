module.exports = profile => {
    return {
            uid: profile.id,
            persistentId: 'samlEntityIdHere|'+profile.issuer+'|'+profile.id,
            claims: profile.claims
    }
}
