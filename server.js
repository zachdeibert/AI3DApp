var http = require("http");
var util = require("./lib/util.js");
var programName = "pipe";
var program = require("./serverPrograms/" + programName + ".js");
var port = 8080;
var log = false;

var Client = function(id, width, height) {
    var x = width / 2;
    var y = height / 2;
    var z = 0;
    var lastTime = new Date().getTime();
    var prgm = program.create(width, height);
    this.id = id;
   
    this.request = function(dx, dy, dz) {
        var response = [];
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
        prgm.request(response, x, y, z, dt);
        return response;
    };
};

var clients = {};

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
            var token = util.randomToken(function() {
                return clients.hasOwnProperty(token);
            });
            clients[token] = new Client(token, util.toInt(args[0]), util.toInt(args[1]));
            send(token);
        } else if ( util.fullRegex(req.url, /\/frame\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/) && args.length == 3 ) {
            var token = req.url.substr(7);
            if ( clients.hasOwnProperty(token) ) {
                send(util.serializeCSV(clients[token].request(util.toFloat(args[0]), util.toFloat(args[1]), util.toFloat(args[2]))));
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
