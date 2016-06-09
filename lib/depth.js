var pixels = require("./pixels.js");

exports.createDepthBuffer = function(width, height) {
    return pixels.createArray(width, function() {
        return pixels.createArray(height, function() {
            return Number.MIN_SAFE_INTEGER;
        });
    });
};

exports.drawPixel = function(pixelList, depthBuffer, x, y, z, color) {
    if ( x >= 0 && x < depthBuffer.length && y >= 0 && y < depthBuffer[0].length && depthBuffer[x][y] <= z ) {
        depthBuffer[x][y] = z;
        pixelList.push(pixels.createPixel(x, y, color));
    }
};
