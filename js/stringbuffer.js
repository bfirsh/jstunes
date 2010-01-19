// A buffer for binary strings, such as those produced by FileReader

function StringBuffer(buf) {
    this.buf = buf;
    this.bufLength = buf.length; // Length operations sometimes appear expensive
    this.pos = 0;
}

StringBuffer.prototype.read = function(n) {
    if (this.buf.length - this.pos < n) {
        return null;
    }
    
    out = new Array(n);
    for (var i = 0; i < n; i++) {
        out[i] = this.buf.charCodeAt(this.pos+i);
    }
    this.pos += n;
    return out;
}
