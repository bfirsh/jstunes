
function Buffer(buf) {
    this.buf = buf;
    this.pos = 0;
}

Buffer.prototype.read = function(n) {
    if (this.buf.length - this.pos < n) {
        return null;
    }
    
    out = new Array(n);
    for (var i = 0; i < n; i++) {
        out[i] = this.buf[this.pos+i];
    }
    this.pos += n;
    return out;
}
