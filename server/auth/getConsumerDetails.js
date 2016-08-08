var http = require("http");

exports.getJSON = function(options, onResult) {
    var req = http.request(options, function(res) {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            //console.log("data: ", obj);
            onResult(null, obj);
        });
    });

    req.on('error', function(err) {
        onResult(err, null);
        //res.send('error: ' + err.message);
    });

    req.end();
};
