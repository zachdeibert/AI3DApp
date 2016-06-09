var depth = require("./depth.js");

exports.drawSphere = function(pixelList, depthBuffer, x, y, z, r, color) {
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
            depth.drawPixel(pixelList, depthBuffer, Math.round(rx), Math.round(ry), Math.round(rz), color.value(Number.isNaN(v) ? 0 : v));
        }
    }
}
