/*
The lines you need to write a parametric equaliser, in BASIC (from Musical Applications of Microcomputers by Hal Chamberlin, a classic), are simply:

100 LET L = D2 + F1 * D1
110 LET H = I - L - Q1 * D1
120 LET B = F1 * H + D1
130 LET D1 = B
140 LET D2 = L

I is the input sample. Call the above for each input sample. D1 and D2 are
delay accumulators, initially 0, and must persist across calls. The value in
those may exceed the dynamic range of the input, depending upon the
control settings (e.g. with a very resonant filter): F1 is related to the filter
centre frequency and Q1 to the resonance (passband width) of the filter.

Those are the two most fun knobs from an analogue synth!

After each call to the above code you end up with a new middle-band output
in B (also persisted in D1, so B is optional but aids readability and makes
it less likely you'll get old and new data muddled up in optimisation)
and the low-pass (Bass) output in L (D2), and the Treble (high pass) in H.
Just scale those and sum them, to get what ever tonal mix you like. For
instance to get a notch (middle cut) filter you use H+L as your output. Scale
and mix all three independently and you've got Treble, Mid and Bass controls,
as well as Freq and Res, which is a classic five-knob parametric equaliser.

The centre frequency for the middle band is determined as a ratio of the
sample rate FS and the desired centre frequency FC, both usually in Hertz,
where F1 = 2 * SIN(PI * FC / FS); keep FC well below the Nyquist limit
(FS/2) to avoid possible instability. The width of the middle band, and
hence the resonance (tendency to emphasise the centre frequency, possibly
harshly) is determined by Q1 where a value of 1 means that the width of
the centre band is the same as the centre frequency, 0.5 means it has
half the centre frequency width, in Hertz, and the maximum sensible value is
2 which means the mid-band extends to 0 Hertz. Classic ear-friendly
filters (Butterworth etc) use a value around 1.5, for minimum phase or level
wobble in the passband - see Wikipedia. Very low values tend to oscillate.

This filter has a fixed roll-off slope of 12 dB/octave down on the low-pass
and up on the treble output.

One set of examples:

FC = 2 KHz; FS = 48 KHz; so F1 = 0.00457; Q = Q1 = 1 (to keep it simple);
Centre band will be 1KHz..3 KHz, low will be up to 1 KHz and tail off at
-12 dB/octave above that (so -24 dB at 4 KHz, etc) and high will pass
stuff above 3 KHz unscathed (apart from some phase bending, dependent
on Q) and be -24 dB down for components at 750 Hertz, etc.

N.B. This is the inverse of common 'Q' naming which terms a 'high Q' filter
(one with a sharp narrow band) with a value of Q of 8 or more, and musical
settings in the range 0.5 to 2.0. Infinite Q gives you an oscillator that
plays a sine wave at FC as soon as it has a click to latch onto. However
Q1 of 0 does this more easily than trying to express infinity in fixed
point (or IEEE754 if you want to do anything with it), and divisions are
expensive at runtime so it makes more sense to use the reciprocal of the
number in the literature.

These parameters only need to be re-computed when the FREQ or RES knobs
move - not every sample (even 30 times a second would be plenty) and can
be read or interpolated from a table of sensible/allowed values.

If you try this and play with FC using an initial Q (and Q1) of 1.0 (so one
less multiply) I think you'll rapidly get the idea. It's the quickest route
to magic I've ever found in Computer Science. You need the book for
background and lots of other goodies, though ;-)

For more bands or steeper slope, cascade several of these; not as cheap
tho'.
*/


function EQ(fs) {
    this.fs = fs;
    
    this.treble = 1.0;
    this.mid = 1.0;
    this.bass = 1.0;
    
    this.reset();
}

EQ.prototype.reset = function() {
    this.d1 = 0;
    this.d2 = 0;
    this.q1 = 1.0;
    this.updateFreq(2000);
}

EQ.prototype.updateFreq = function(freq) {
    this.f1 = 2 * Math.sin(Math.PI * freq / this.fs);
}

EQ.prototype.process = function(samples) {
    var d1 = this.d1;
    var d2 = this.d2;
    var f1 = this.f1;
    var q1 = this.q1;
    var treble = this.treble;
    var mid = this.mid;
    var bass = this.bass;
    
    var l, h, b;
    
    for (var i = 0; i < samples.length; i++) {
        l = d2 + f1 * d1;
        h = samples[i] - l - q1 * d1;
        b = f1 * h + d1;
        d1 = b;
        d2 = l;
        
        samples[i] = Math.floor((l*bass+b*mid+h*treble)/3);
    }
    
    this.d1 = d1;
    this.d2 = d2;
    
    return samples;
}
