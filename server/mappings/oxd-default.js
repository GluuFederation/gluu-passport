module.exports = profile => {
	let claims = profile.claims
	return {
		uid: claims.user_name,
		mail: claims.email,
		cn: claims.name,
		displayName: claims.name,
		givenName: claims.given_name,
		sn: claims.family_name
	}
}
