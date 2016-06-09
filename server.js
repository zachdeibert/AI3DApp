var http = require("http");
var guid = require("guid");
var port = 8080;

function createArray(length, valueSelector) {
    var array = [];
    for ( var i = 0; i < length; ++i ) {
        array.push(valueSelector());
    }
    return array;
}

function createPixel(x, y, r, g, b) {
    return [
        x + 1,
        y + 1,
        r * 255,
        g * 255,
        b * 255
    ];
}

var Client = function(id, width, height) {
    var depthBuffer = createArray(width, function() {
        return createArray(height, function() {
            return Number.MAX_SAFE_INTEGER;
        });
    });
    this.id = id;
    
    this.request = function(dx, dy, dz) {
        var response = [];
        response.push(createPixel(0, 0, 1, 0, 0));
        response.push(createPixel(width - 1, 0, 0, 1, 0));
        response.push(createPixel(width - 1, height - 1, 0, 0, 1));
        response.push(createPixel(0, height - 1, 0, 1, 1, 0));
        return response;
    };
};

var clients = {};

function randomToken() {
    var token = guid.create().toString();
    if ( clients.hasOwnProperty(token) ) {
        return randomToken();
    } else {
        return token;
    }
}

function fullRegex(str, regex) {
    var res = str.match(regex);
    return res != null && res.length == 1 && res[0].length == str.length;
}

function serializeCSV(array) {
    var csv = "";
    for ( var i = 0; i < array.length; ++i ) {
        for ( var j = 0; j < array[i].length; ++j ) {
            if ( j > 0 ) {
                csv += ",";
            }
            csv += array[i][j];
        }
        csv += "\n";
    }
    return csv;
}

var server = http.createServer(function(req, res) {
    req.on("data", function(chunk) {
        var str = chunk.toString();
        var args = str.split(",");
        if ( req.url == "/login" && args.length == 2 ) {
            var token = randomToken();
            clients[token] = new Client(token, parseInt(args[0]), parseInt(args[1]));
            res.end(token);
        } else if ( fullRegex(req.url, /\/frame\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/) && args.length == 3 ) {
            var token = req.url.substr(7);
            if ( clients.hasOwnProperty(token) ) {
                res.end(serializeCSV(clients[token].request(parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]))));
            } else {
                res.end("Invalid token");
            }
        } else {
            res.end("Invalid protocol");
        }
    });
});

server.listen(port, function() {
    console.log("Server started on http://0.0.0.0:%d/", port);
});
