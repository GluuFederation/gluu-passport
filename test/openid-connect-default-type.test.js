const request = require('supertest');

describe('Openidconnect-default type passport flow', () => {
	it('Authorization request to external OP', (done) => {
		request(app)
			.get('/passport/token')
			.expect(200)
			.end((err, tokenResponse) => {
                if (err) return done(err);
                
                expect(200).to.equal(tokenResponse.statusCode);
                
                request(app)
					.get('/passport/auth/cedev6/' + tokenResponse.token_)
					.expect(302)
					.end((err, authRedirectResponse) => {
						if (err) return done(err);

                        expect(302).to.equal(authRedirectResponse.statusCode);

						const code = "1234567890"
						request(app)
							.get('/passport/auth/cedev6/callback?code=' + code + '&state=1234567890')
							.expect(302)
							.end((err, passportAuthResponse) => {
								if (err) return done(err);

                                expect(302).to.equal(passportAuthResponse.statusCode);
								done();
							});
					});
			});
	});
});
