function formatTime(seconds) {
    var s = Math.floor(seconds / 60).toString() + ':';
    if (seconds % 60 < 10) {
        s += '0';
    }
    return s + Math.floor(seconds % 60).toString();
}