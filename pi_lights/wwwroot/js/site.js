// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
// You might need ES6 Collections polyfill for Maps / Sets
// from: https://github.com/WebReflection/es6-collections

// Define OnScreenMidiInput and FauxHtmlMidiAccess as partial implementations of the WebMIDI Api

// OnScreenMidiInput - It's a polyfil of MIDIInput
// http://www.w3.org/TR/webmidi/#idl-def-MIDIInput
OnScreenMidiInput = function (id) {
    this.id = id;
    this.manufacturer = 'RumyraIndustries';
    this.name = 'HtmlMidiInputFaker';
    this.type = 'input';
    this.version = 1;
    this.state = 'connected';
    this.connection = 'open';
    this.onstatechange = null;
    this.onmidimessage = null;

    // opening and closing this MidiPort won't do anything
    this.open = function () { return; };
    this.close = function () { return; };

    this._listeners = new Map().set('midimessage', new Set()).set('statechange', new Set());
}

// Event handling
OnScreenMidiInput.prototype.addEventListener = function (type, listener, useCapture) {
    var listeners = this._listeners.get(type);
    if (listeners !== undefined && listeners.has(listener) === false) {
        listeners.add(listener);
    }
}

OnScreenMidiInput.prototype.removeEventListener = function (type, listener, useCapture) {
    var listeners = this._listeners.get(type);
    if (listeners !== undefined && listeners.has(listener) === false) {
        listeners.delete(listener);
    }
}

OnScreenMidiInput.prototype.dispatchEvent = function (evt) {
    var listeners = this._listeners.get(evt.type);
    listeners.forEach(function (listener) {
        listener(evt);
    });

    if (evt.type === 'midimessage') {
        if (this.onmidimessage !== null) {
            this.onmidimessage(evt);
        }
    } else if (evt.type === 'statechange') {
        if (this.onstatechange !== null) {
            this.onstatechange(evt);
        }
    }
}
// end OnScreenMidiInput

// FauxMidiAccess - it's a polyfil of MIDIAccess
// http://www.w3.org/TR/webmidi/#idl-def-MIDIAccess
// midiInputs is a Map() containing one or more thing that looks like a MIDIInput (i.e. for us, a OnScreenMidiInput)
// midiOutputs is a Map() containing one or more thing that looks like a MIDIOutput (we don't care about this yet)
FauxMidiAccess = function (midiInputs, midiOutputs) {
    this.inputs = midiInputs;
    this.outputs = midiOutputs;
    // Do nothing as we aren't modeling attacting / detaching new devices (YET?).
    this.onstatechange = null;
    // Not modeling Sysex
    this.sysexEnabled = false;
};
//end FauxMidiAccess


FauxMidiMessageEvent = function (port, data, receivedTime) {
    this.bubbles = false;
    this.cancelBubble = false;
    this.cancelable = false;
    this.currentTarget = port;
    this.data = data;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.path = [];
    this.receivedTime = receivedTime;
    this.returnValue = true;
    this.srcElement = port;
    this.target = port;
    this.timeStamp = Date.now();
    this.type = 'midimessage';
}

/////////////////////////////////////////

// INPUT TYPES (only Buttons ATM)
// Add the various types of interface you want here. Atm we've only got buttons, but sliders would be easy
// Create a DOM element, give it a data-midi attribute that is a json blob, then use the
// createMidiUxInput factory to assign event handlers to that element based based off that data.

// MidiUxButton - a Button, containng press and release triggers
// onScreenMidiInput is the MidiInput that you want to trigger events on
var MidiUxButton = function (onScreenMidiInput, pressMessage, releaseMessage) {
    this.eventHandlers = {
        'mousedown': function (e) {
            var e = new FauxMidiMessageEvent(onScreenMidiInput, Uint8Array.from(pressMessage), performance.now());
            onScreenMidiInput.dispatchEvent(e);
        },
        'mouseup': function (e) {
            var e = new FauxMidiMessageEvent(onScreenMidiInput, Uint8Array.from(releaseMessage), performance.now());
            onScreenMidiInput.dispatchEvent(e);
        }
    };
};

// INPUT TYPES FACTORY
var createMidiUxInput = function (onScreenMidiInput, data) {
    if (!data.hasOwnProperty('type')) {
        throw new Exception('Could not create Midi Input as data blob does not have a type property');
    }

    if (data.type == 'button') {
        return new MidiUxButton(onScreenMidiInput, data.press, data.release);
    }

    throw new Exception('Could not create Midi Input as data blob does not have a valid type property. Was "' + data.type + '"');
};

//util foreach
var forEach = function (array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); // passes back stuff we need
    }
};

// Logging from MIDI Controller into a console 
var midiEles = document.querySelectorAll('[data-midi]');
var midi, data
var myOnScreenMidiInput = new OnScreenMidiInput(1);

// Create a MidiUxInput for each html element, then connect event handlers
// descibed by the MidiUxInput to the HTML element
forEach(midiEles, function (i, ele) {
    var rawMidiData = JSON.parse(ele.getAttribute('data-midi'));
    var midiUxInput = createMidiUxInput(myOnScreenMidiInput, rawMidiData);

    for (var eventName in midiUxInput.eventHandlers) {
        ele.addEventListener(eventName, midiUxInput.eventHandlers[eventName]);
    }
});

midi = new FauxMidiAccess(
    new Map().set(myOnScreenMidiInput.id, myOnScreenMidiInput),
    new Map()
);

onMIDISuccess(midi);
function onMIDISuccess(midiData) {
    midi = midiData;
    var allInputs = midi.inputs.values();
    for (var input = allInputs.next(); input && !input.done; input = allInputs.next()) {
        input.value.onmidimessage = gotMIDImessage;
    }
}

var dataList = document.querySelector('#midi-data ul')
function gotMIDImessage(messageData) {
    var newItem = document.createElement('li');
    newItem.appendChild(document.createTextNode(messageData.data));
    dataList.appendChild(newItem);
}
