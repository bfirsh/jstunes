function formatTime(seconds) {
    var s = Math.floor(seconds / 60).toString() + ':';
    if (seconds % 60 < 10) {
        s += '0';
    }
    return s + Math.floor(seconds % 60).toString();
}

function expVolume(v) {
    // http://www.dr-lex.be/info-stuff/volumecontrols.html
    return Math.exp(6.908*v)/1000;
}
