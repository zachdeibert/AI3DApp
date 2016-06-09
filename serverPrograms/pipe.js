var onecolor = require("onecolor");
var depth = require("../lib/depth.js");
var solids = require("../lib/solids.js");

function size(z) {
    var size = 15 + z * 0.1;
    if ( size < 1 ) {
        size = 1;
    }
    return size;
}

var PipeProgram = function(width, height) {
    var depthBuffer = depth.createDepthBuffer(width, height);
    var color = new onecolor.HSV(1, 1, 1, 1);
    
    this.request = function(pixelList, x, y, z, dt) {
        color = color.hue(0.05 * dt, true);
        solids.drawSphere(pixelList, depthBuffer, x, y, z, size(z), color);
    };
};

exports.create = function(width, height) {
    return new PipeProgram(width, height);
};
