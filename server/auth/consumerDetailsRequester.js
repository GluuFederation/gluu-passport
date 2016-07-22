var http = require('http');
var credentialsRequester = function(providerName, callback){
    var jsonObject = JSON.stringify({"provider": providerName});
    // prepare the header
    var postheaders = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonObject, 'utf8')
    };

    // the post options
    var optionspost = {
        host: '192.168.200.68',
        port: 7777,
        path: '/auth',
        method: 'POST',
        headers: postheaders
    };
    // do the POST call
    var reqPost = http.request(optionspost, function (res) {
        console.log("statusCode: ", res.statusCode);

        if (res.statusCode == 200) {
            console.log("called");
        }

        // uncomment it for header details
        //  console.log("headers: ", res.headers);

        res.on('data', function (d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            var data = JSON.parse(d.toString('utf8'));
            console.log("Data: ", data.consumerKey);
            console.info('\nPOST completed');
            callback(null, data);
        });
    });
    // write the json data
    reqPost.write(jsonObject);
    reqPost.end();
    reqPost.on('error', function (e) {
        console.error(e);
    });

    //END
}
exports.credentialsRequester = credentialsRequester;