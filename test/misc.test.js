const chai = require('chai')
const misc = require('../server/utils/misc')

const assert = chai.assert

describe('misc.arrify', () => {
	// This functions aims at transforming every key value of an object in the following way:

	// 	"" --> []
	// 	"hi" --> ["hi"]
	// 	["hi", "there"] --> ["hi", "there"]
	// 	[{"attr":"hi"}, {"attr":"there"}] --> ['{"attr":"hi"}', '{"attr":"there"}']
	// 	{"attr":"hi"} --> ['{"attr":"hi"}']
	// 	[] --> []
	// 	null --> []
	// 	undefined --> []

	// 	Object members which are functions are dropped

	it('arrify should transform { "mail" : ""} in { mail : [] } ', () => {
		assert.deepEqual(
			misc.arrify({'mail' : ''}),
			{ 'mail' : [] }
		)
	})

	it('arrify should transform { "username" : "johndoe" }' +
	' in { "username" : ["johndoe"] }', () => {
		assert.deepEqual(
			misc.arrify({ 'username' : 'johndoe' }),
			{ 'username' : ['johndoe'] }
		)
	})

	it('arrify should transform ' +
	'{ "mail" : [ "business@mail.com" , "personal@mail.com"] }' +
	' in { "mail" : [ "business@mail.com" , "personal@mail.com"] }', () => {
		assert.deepEqual(
			misc.arrify( { 'mail' : [ 'business@mail.com' , 'personal@mail.com'] } ),
			{ 'mail' : [ 'business@mail.com' , 'personal@mail.com'] }
		)
	})

	it(' { "job" : [{"company":"gluu"}, {"role":"devops"}] } ' +
	'in { "job" : ["{"company":"gluu"}", "{"role":"devops"}"] }', () => {

		assert.deepEqual(
			misc.arrify(
				{ 'job' : [{'company':'gluu'}, {'role':'devops'}] }
			),
			{ 'job' : ['{"company":"gluu"}', '{"role":"devops"}'] }
		)
	})


	it(' { "mail" : { "gmail" : "johndoe@gmail.com" } } ' +
	'in { "mail" : ["{"gmail" : "johndoe@gmail.com"}"] }', () => {
		assert.deepEqual(
			misc.arrify({ 'mail' : { 'gmail' : 'johndoe@gmail.com' } }),
			{ 'mail' : ['{"gmail":"johndoe@gmail.com"}'] }
		)
	})

	it(' { profiles : [] } --> { profiles : [] }', () => {
		assert.deepEqual(
			misc.arrify({ profiles : [] }),
			{ profiles : [] }
		)
	})

	it(' { profiles : undefined } --> { profiles : [] }', () => {
		assert.deepEqual(
			misc.arrify({ profiles : undefined }),
			{ profiles : [] }
		)
	})

	it(' { profiles : null } --> { profiles : [] }', () => {
		assert.deepEqual(
			misc.arrify({ profiles : null }),
			{ profiles : [] }
		)
	})



	// it('[] --> []', () => {
	// 	assert.deepEqual(
	// 		misc.arrify([]),
	// 		[]
	// 	)
	// })


	// it('null --> []', () => {
	// 	assert.deepEqual(
	// 		misc.arrify(null),
	// 		[]
	// 	)
	// })

	// it('undefined --> []', () => {
	// 	assert.deepEqual(
	// 		misc.arrify(undefined),
	// 		[]
	// 	)
	// })

	// it('Object members which are functions are dropped', () => {
	// 	assert.deepEqual(
	// 		misc.arrify(function unarrify(){}),
	// 		[]
	// 	)
	// })

	// it('{"key":"value", "key2":"value2"} --> {"key":["value"], "key2":["value2"]}', () => {
	// 	assert.deepEqual(
	// 		misc.arrify({'key':'value', 'key2':'value2'}),
	// 		{"key":["value"], "key2":["value2"]}
	// 	)
	// })
	// {"uid":"tester4","mail":"tester4@test.com","cn":"tester4","displayName":"tester4","givenName":"Tester","sn":"Lasttest3"}"
	// {"uid":["tester4"],"mail":["tester4@test.com"],"cn":["tester4"],"displayName":["tester4"],"givenName":["Tester"],"sn":["Lasttest3"]}
})
