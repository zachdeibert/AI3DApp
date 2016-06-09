var http = require("http");
var guid = require("guid");
var onecolor = require("onecolor");
var port = 8080;
var log = false;

function createArray(length, valueSelector) {
    var array = [];
    for ( var i = 0; i < length; ++i ) {
        array.push(valueSelector());
    }
    return array;
}

/*
function createPixel(x, y, r, g, b) {
    return [
        x + 1,
        y + 1,
        r * 255,
        g * 255,
        b * 255
    ];
}
*/

function createPixel(x, y, color) {
    return [
        x + 1,
        y + 1,
        color.red() * 255,
        color.green() * 255,
        color.blue() * 255
    ];
}

var Client = function(id, width, height) {
    var depthBuffer = createArray(width, function() {
        return createArray(height, function() {
            return Number.MAX_SAFE_INTEGER;
        });
    });
    var color = new onecolor.HSV(1, 1, 1, 1);
    this.id = id;
    
    this.request = function(dx, dy, dz) {
        var response = [];
        color = color.hue(0.05, true);
        /*
        response.push(createPixel(0, 0, 1, 0, 0));
        response.push(createPixel(width - 1, 0, 0, 1, 0));
        response.push(createPixel(width - 1, height - 1, 0, 0, 1));
        response.push(createPixel(0, height - 1, 0, 1, 1, 0));
        */
        for ( var x = width / 2 - 10; x < width / 2 + 10; ++x ) {
            for ( var y = height / 2 - 10; y < height / 2 + 10; ++y ) {
                response.push(createPixel(x, y, color));
            }
        }
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

function toInt(str) {
    return parseInt(str.replace("\"", ""));
}

function toFloat(str) {
    return parseFloat(str.replace("\"", ""));
}

var server = http.createServer(function(req, res) {
    function send(data) {
        res.end(data);
        if ( log ) {
            console.log("> %s", data);
        }
    }
    if ( log ) {
        console.log("Request to %s", req.url);
    }
    req.on("data", function(chunk) {
        var str = chunk.toString();
        if ( log ) {
            console.log("< %s", str);
        }
        var args = str.split(",");
        if ( req.url == "/login" && args.length == 2 ) {
            var token = randomToken();
            clients[token] = new Client(token, toInt(args[0]), toInt(args[1]));
            send(token);
        } else if ( fullRegex(req.url, /\/frame\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/) && args.length == 3 ) {
            var token = req.url.substr(7);
            if ( clients.hasOwnProperty(token) ) {
                send(serializeCSV(clients[token].request(toFloat(args[0]), toFloat(args[1]), toFloat(args[2]))));
            } else {
                send("Invalid token");
            }
        } else {
            send("Invalid protocol");
        }
    });
});

server.listen(port, function() {
    console.log("Server started on http://0.0.0.0:%d/", port);
});
