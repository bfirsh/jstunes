
function JSTunes(jstunesRoot) {
    var jstunes = this;
    jstunes.root = jstunesRoot;
    jstunes.loaded = false;
    jstunes.playing = false;
    jstunes.file = null;
    jstunes.eq = null;
    jstunes.positionSliding = false;
    jstunes.status = $('#status');
    
    if ($.browser.mozilla && $.browser.version.substr(0,3)=="1.9" && parseInt($.browser.version[4]) >= 2) {
        $('#status').text('Ready. Select a file:');
    }
    else {
        $('#status').text("You aren't running Firefox 3.6, this might not work!");
    }
    
    jstunes.root.html('<input type="file" id="file">\
        <div id="player">\
            <div id="position-slider"></div>\
            <p id="position">0:00</p>\
            <p id="length">0:00</p>\
            <input type="button" value="play" id="playpause" disabled="disabled">\
            <div id="controls">\
                <div id="volume">\
                    <p class="ui-state-default ui-corner-all ui-helper-clearfix" style="padding:4px; margin-right: 10px">\
                    <span class="ui-icon ui-icon-volume-on" style="float:left; margin:-2px 5px 0 0;"></span>\
                    Volume (<span class="value">100</span>%)\
                    </p>\
                    <div id="volume-slider"></div>\
                </div>\
                <div id="eq">\
                    <p class="ui-state-default ui-corner-all" style="padding:4px">\
                    <span class="ui-icon ui-icon-signal" style="float:left; margin:-2px 5px 0 0;"></span>\
                    EQ <input type="checkbox" id="eq-enable">\
                    </p>\
                    <span id="bass"><label>Bass</label></span>\
                    <span id="mid"><label>Mid</label></span>\
                    <span id="treble"><label>Treble</label></span>\
                    <div id="freq"><label>Mid Frequency (<span class="value">2000</span> Hz)</label></div>\
                    <div id="width"></div>\
                </div>\
            </div>\
        </div>');
    
    $.extend($.ui.slider.defaults, {
        range: "min",
        animate: true,
        max: 1000,
        value: 1000
    });
    
    $('#file').change(function() { 
        binaryReader = new FileReader();
        binaryReader.onprogress = function(evt) {
            if (evt.lengthComputable) {
                jstunes.status.text('Loading '+$(this).val()+' ('+Math.floor(evt.loaded/evt.total*100)+'%) ...');
            }
        };
        binaryReader.onerror = function(evt) {
            if(evt.target.error.code == evt.target.error.NOT_FOUND_ERR) {
                jstunes.status.text("File Not Found!");
            }
        };
        binaryReader.onload = function() {
            jstunes.loadFile(binaryReader.result);
        };
        binaryReader.readAsBinaryString($(this).get(0).files[0]);
    });
    
    jstunes.loadFile = function(buffer) {
        var file = new WavFile(new StringBuffer(buffer));
        var eq = new EQ(44100);
        jstunes.file = file;
        jstunes.eq = eq;

        jstunes.status.text('Loaded.');

        $("#playpause").attr("disabled", null).attr("value", "play");

        // Set up position slider
        $('#length').text(jstunes.formatTime(file.lengthSeconds));
        var slider = $("#position-slider").slider({
            value: 0,
            orientation: "horizontal"
        }).bind('slidechange', function(event, ui) {
            file.skipToSample(Math.floor(ui.value/1000 * file.lengthSamples));
        }).bind('slidestart', function(event, ui) {
            jstunes.positionSliding = true;
        }).bind('slidestop', function(event, ui){
            jstunes.positionSliding = false;
        }).bind('slide', function(event, ui){
            $('#position').text(jstunes.formatTime(ui.value/1000 * file.lengthSeconds));
        });

        // Set up volume
        var volumeValue = $('#volume .value');
        $("#volume div").slider({
            value: 1000,
            orientation: "horizontal"
        }).bind('slide', function(event, ui) {
            volumeValue.text(Math.floor(ui.value/10));
            file.volume = jstunes.expVolume(ui.value/1000);
        });
        // Set up EQ
        $("#eq #bass").slider({
            orientation: "vertical"
        }).bind('slide', function(event, ui) {
            eq.bass = ui.value/1000;
        });
        $("#eq #mid").slider({
            orientation: "vertical"
        }).bind('slide', function(event, ui) {
            eq.mid = ui.value/1000;
        });
        $("#eq #treble").slider({
            orientation: "vertical"
        }).bind('slide', function(event, ui) {
            eq.treble = ui.value/1000;
        });

        var freqValue = $('#freq .value');
        $("#eq #freq").slider({
            orientation: "horizontal",
            max: 5000,
            min: 200,
            value: 2000
        }).bind('slide', function(event, ui) {
            freqValue.text(Math.floor(ui.value));
            eq.updateFreq(ui.value);
        });

        $('#eq-enable').change(function() {
            eq.enabled = $(this).get(0).checked;
        });
    
        $("#playpause").click(function() {
            if ($(this).attr("value") == "play") {
                jstunes.playing = true;
                jstunes.status.text("Playing");
                $(this).attr("value", "pause");
            }
            else {
                jstunes.playing = false;
                jstunes.status.text("Paused");
                $(this).attr("value", "play");
            }
        });
    
        $('#file').hide();
        $('#player').show();
        
        jstunes.loaded = true;
    }
    
    jstunes.readSamples = function(count) {
        var data = jstunes.file.readSamples(count);
        var out_left = data[0];
        var out_right = data[1];
        
        out_left = jstunes.eq.process(out_left);
        out_right = jstunes.eq.process(out_right);

        var out = new Array(count*2);

        var j = 0;
        for (var i=0; i<count; i++) {
            out[j++] = out_left[i];
            out[j++] = out_right[i];
        }
        return out;
    }
    
    jstunes.formatTime = function(seconds) {
        var s = Math.floor(seconds / 60).toString() + ':';
        if (seconds % 60 < 10) {
            s += '0';
        }
        return s + Math.floor(seconds % 60).toString();
    }

    jstunes.expVolume = function(v) {
        // http://www.dr-lex.be/info-stuff/volumecontrols.html
        return Math.exp(6.908*v)/1000;
    }
}
