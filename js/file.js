

function WavFile(buffer) {
    // https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
    
    this.buffer = buffer;
    this.positionSeconds = 0;
    this.volume = 1.0;
    
    var riffHeader = this.buffer.read(12);
    if (String.fromCharCode(riffHeader[0], riffHeader[1], riffHeader[2], riffHeader[3]) != "RIFF" || String.fromCharCode(riffHeader[8], riffHeader[9], riffHeader[10], riffHeader[11]) != "WAVE") {
        // TODO: exceptions
        $('#status').text('File is not a RIFF WAVE container.');
        return null;
    }
    
    var fmt = this.buffer.read(24);
    if (fmt[8] != 1) {
        $('#status').text('File is not uncompressed PCM.');
        return null;
    }
    
    if (fmt[10] != 2) {
        $('#status').text('Only stereo is supported.');
        return null;
    }
    
    if ((fmt[13] << 8 | fmt[12]) != 44100) {
        $('#status').text('Only 44,100 Hz sample rate is supported.');
        return null;
    }
    
    if (fmt[22] != 16) {
        $('#status').text('Only 16 bits per sample is supported.');
        return null;
    }
    
    this.buffer.read(4);
    var sizeArray = this.buffer.read(4);
    this.lengthBytes = sizeArray[3] << 24 | sizeArray[2] << 16 | sizeArray[1] << 8 | sizeArray[0];
    this.lengthSamples = this.lengthBytes / 4;
    this.lengthSeconds = this.lengthSamples / 44100;
}

WavFile.prototype.readSamples = function(count) {
    /*
     * Returns two arrays of left and right samples as signed 16 bit integers
     */
    
    var data = this.buffer.read(count*4);
    
    var out_left = new Array(count);
    var out_right = new Array(count);
    
    var left, right, dataPos;
    for (var i=0; i<count; i++) {
        dataPos = i*4;
        left = data[dataPos+1] << 8 | data[dataPos];
        if (data[dataPos+1] >> 7 == 1) {
            left -= 65536;
        }
        left = Math.floor(left * this.volume);
        
        right = data[dataPos+3] << 8 | data[dataPos+2];
        if (data[dataPos+3] >> 7 == 1) {
            right -= 65536;
        }
        right = Math.floor(right * this.volume);
        
        out_left[i] = left;
        out_right[i] = right;
    }
	
    this.positionSeconds = (this.buffer.pos / this.lengthBytes) * this.lengthSeconds;
    
    return [out_left, out_right];
}

WavFile.prototype.skipToSample = function(sample) {
    this.buffer.pos = 44 + sample * 4;
}

