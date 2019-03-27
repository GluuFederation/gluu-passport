module.exports = profile => {
	return {
		uid: profile.username || profile._json.id,
		mail: profile._json.email,
		cn: profile.displayName,
		displayName: profile.displayName,
		givenName: profile.name.givenName,
		sn: profile.name.familyName
	}
}
