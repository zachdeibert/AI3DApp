exports.createArray = function(length, valueSelector) {
    var array = [];
    for ( var i = 0; i < length; ++i ) {
        array.push(valueSelector());
    }
    return array;
};

exports.createPixel = function(x, y, color) {
    return [
        Math.round(x + 1),
        Math.round(y + 1),
        Math.round(color.red() * 255),
        Math.round(color.green() * 255),
        Math.round(color.blue() * 255)
    ];
};
