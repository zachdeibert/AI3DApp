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

function createPixel(x, y, color) {
    return [
        x + 1,
        y + 1,
        color.red() * 255,
        color.green() * 255,
        color.blue() * 255
    ];
}

function size(z) {
    var size = 15 + z * 0.1;
    if ( size < 1 ) {
        size = 1;
    }
    return size;
}

var Client = function(id, width, height) {
    var depthBuffer = createArray(width, function() {
        return createArray(height, function() {
            return Number.MIN_SAFE_INTEGER;
        });
    });
    var color = new onecolor.HSV(1, 1, 1, 1);
    var x = width / 2;
    var y = height / 2;
    var z = 0;
    var lastTime = new Date().getTime();
    this.id = id;

    function drawPixel(pixels, x, y, z, color) {
        if ( x >= 0 && x < width && y >= 0 && y < height && depthBuffer[x][y] <= z ) {
            depthBuffer[x][y] = z;
            pixels.push(createPixel(x, y, color));
        }
    }

    function drawSphere(pixels, x, y, z, r, color) {
        var r2 = r * r;
        var rFactor = r / 0.7;
        for ( var i = -r; i < r; ++i ) {
            var rx = x + i;
            var r2minusi2 = r2 - i * i;
            var limJ = Math.sqrt(r2minusi2);
            for ( var j = -limJ; j < limJ; ++j ) {
                var ry = y + j;
                var limK = Math.sqrt(r2minusi2 - j * j);
                var rz = z + limK;
                var v = limK / rFactor + 0.3;
                drawPixel(pixels, Math.round(rx), Math.round(ry), Math.round(rz), color.value(Number.isNaN(v) ? 0 : v));
            }
        }
    }
    
    this.request = function(dx, dy, dz) {
        console.log(dz);
        var response = [];
        color = color.hue(0.05, true);
        var time = new Date().getTime();
        var dt = (time - lastTime) / 1000;
        lastTime = time;
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;
        if ( x < 0 ) {
            x = 0;
        } else if ( x >= width ) {
            x = width - 1;
        }
        if ( y < 0 ) {
            y = 0;
        } else if ( y >= height ) {
            y = height - 1;
        }
        drawSphere(response, x, y, z, size(z), color);
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
