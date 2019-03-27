module.exports = profile => {
	return {
		uid: profile.username || profile.id,
		mail: profile.emails && profile.emails[0] && profile.emails[0].value,
		cn: profile.displayName,
		displayName: profile.displayName,
		givenName: profile.name.familyName,
		sn: profile.name.givenName
	}
}
