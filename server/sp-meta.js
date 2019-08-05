const
	fs = require('fs'),
	path = require('path'),
	R = require('ramda'),
	Promise = require('bluebird'),
	misc = require('./utils/misc'),
	openF = misc.curry2AndFlip(Promise.promisify(fs.open)),
	writeF = misc.curry2AndFlip(Promise.promisify(fs.write)),
	logger = require('./utils/logging')

function writeMeta(fn, metadata) {

	let fd,
		chain = misc.pipePromise(
					openF('w'),
					fdesc => {
						fd = fdesc
						return fd
					},
					writeF(metadata),
					written => {
						logger.log2('verbose', `${written} bytes were written`)
						return fs.closeSync(fd)		//returns undefined
					}
				)

	logger.log2('info', `Creating file ${fn}`)
	return chain(fn)

}

const
	writeMeta_ = R.curry(writeMeta),
	metadataDir = R.once(() => {
			let idpMetaPath = path.join(__dirname, 'idp-metadata')
			if (!fs.existsSync(idpMetaPath)) {
				fs.mkdirSync(idpMetaPath)
			}
			return idpMetaPath
		})

function generate(provider, samlStrategy) {

	let opts = provider.options,
		fileName = path.join(metadataDir(), provider.id + '.xml'),
		chain = misc.pipePromise(
					dcert => samlStrategy.generateServiceProviderMetadata(dcert, opts.signingCert),
					writeMeta_(fileName)
				)

	logger.log2('info', `Generating XML metadata for ${provider.displayName}`)
	chain(opts.decryptionCert).catch(err => logger.log2('error', `An error occurred: ${err}`))

}

module.exports = {
	generate: generate
}
