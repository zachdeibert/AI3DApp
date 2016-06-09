var guid = require("guid");

exports.randomToken = function(tokenUsedFunc) {
    var token = guid.create().toString();
    if ( tokenUsedFunc(token) ) {
        return randomToken(tokenUsedFunc);
    } else {
        return token;
    }
}

exports.fullRegex = function(str, regex) {
    var res = str.match(regex);
    return res != null && res.length == 1 && res[0].length == str.length;
}

exports.serializeCSV = function(array) {
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

exports.toInt = function(str) {
    return parseInt(str.replace("\"", ""));
}

exports.toFloat = function(str) {
    return parseFloat(str.replace("\"", ""));
}
