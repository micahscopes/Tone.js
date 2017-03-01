import { Tone } from 'core/Tone';

import { Signal } from 'signal/Signal';

import { Source } from 'source/Source';

import { Transport } from 'core/Transport';


	"use strict";

	/**
	 *  @class Oscillator supports a number of features including
	 *         phase rotation, multiple oscillator types (see Oscillator.type),
	 *         and Transport syncing (see Oscillator.syncFrequency).
	 *
	 *  @constructor
	 *  @extends {Source}
	 *  @param {Frequency} [frequency] Starting frequency
	 *  @param {string} [type] The oscillator type. Read more about type below.
	 *  @example
	 * //make and start a 440hz sine tone
	 * var osc = new Oscillator(440, "sine").toMaster().start();
	 */
	export var Oscillator = function(){

		var options = this.optionsObject(arguments, ["frequency", "type"], Oscillator.defaults);
		Source.call(this, options);

		/**
		 *  the main oscillator
		 *  @type {OscillatorNode}
		 *  @private
		 */
		this._oscillator = null;

		/**
		 *  The frequency control.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The detune control signal.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = new Signal(options.detune, Type.Cents);

		/**
		 *  the periodic wave
		 *  @type {PeriodicWave}
		 *  @private
		 */
		this._wave = null;

		/**
		 *  The partials of the oscillator
		 *  @type {Array}
		 *  @private
		 */
		this._partials = this.defaultArg(options.partials, [1]);

		/**
		 *  the phase of the oscillator
		 *  between 0 - 360
		 *  @type {number}
		 *  @private
		 */
		this._phase = options.phase;

		/**
		 *  the type of the oscillator
		 *  @type {string}
		 *  @private
		 */
		this._type = null;

		//setup
		this.type = options.type;
		this.phase = this._phase;
		this._readOnly(["frequency", "detune"]);
	};

	Tone.extend(Oscillator, Source);

	/**
	 *  the default parameters
	 *  @type {Object}
	 */
	Oscillator.defaults = {
		"type" : "sine",
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"partials" : []
	};

	/**
	 *  The Oscillator types
	 *  @enum {String}
	 */
	Oscillator.Type = {
		Sine : "sine",
		Triangle : "triangle",
		Sawtooth : "sawtooth",
		Square : "square",
		Custom : "custom"
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now]
	 *  @private
	 */
	Oscillator.prototype._start = function(time){
		//new oscillator with previous values
		this._oscillator = this.context.createOscillator();
		this._oscillator.setPeriodicWave(this._wave);
		//connect the control signal to the oscillator frequency & detune
		this._oscillator.connect(this.output);
		this.frequency.connect(this._oscillator.frequency);
		this.detune.connect(this._oscillator.detune);
		//start the oscillator
		this._oscillator.start(this.toSeconds(time));
	};

	/**
	 *  stop the oscillator
	 *  @private
	 *  @param  {Time} [time=now] (optional) timing parameter
	 *  @returns {Oscillator} this
	 */
	Oscillator.prototype._stop = function(time){
		if (this._oscillator){
			this._oscillator.stop(this.toSeconds(time));
			this._oscillator = null;
		}
		return this;
	};

	/**
	 *  Sync the signal to the Transport's bpm. Any changes to the transports bpm,
	 *  will also affect the oscillators frequency.
	 *  @returns {Oscillator} this
	 *  @example
	 * Transport.bpm.value = 120;
	 * osc.frequency.value = 440;
	 * //the ration between the bpm and the frequency will be maintained
	 * osc.syncFrequency();
	 * Transport.bpm.value = 240;
	 * // the frequency of the oscillator is doubled to 880
	 */
	Oscillator.prototype.syncFrequency = function(){
		Transport.syncSignal(this.frequency);
		return this;
	};

	/**
	 *  Unsync the oscillator's frequency from the Transport.
	 *  See Oscillator.syncFrequency
	 *  @returns {Oscillator} this
	 */
	Oscillator.prototype.unsyncFrequency = function(){
		Transport.unsyncSignal(this.frequency);
		return this;
	};

	/**
	 * The type of the oscillator: either sine, square, triangle, or sawtooth. Also capable of
	 * setting the first x number of partials of the oscillator. For example: "sine4" would
	 * set be the first 4 partials of the sine wave and "triangle8" would set the first
	 * 8 partials of the triangle wave.
	 * <br><br>
	 * Uses PeriodicWave internally even for native types so that it can set the phase.
	 * PeriodicWave equations are from the
	 * [Webkit Web Audio implementation](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/modules/webaudio/PeriodicWave.cpp&sq=package:chromium).
	 *
	 * @memberOf Oscillator#
	 * @type {string}
	 * @name type
	 * @example
	 * //set it to a square wave
	 * osc.type = "square";
	 * @example
	 * //set the first 6 partials of a sawtooth wave
	 * osc.type = "sawtooth6";
	 */
	Object.defineProperty(Oscillator.prototype, "type", {
		get : function(){
			return this._type;
		},
		set : function(type){
			var coefs = this._getRealImaginary(type, this._phase);
			var periodicWave = this.context.createPeriodicWave(coefs[0], coefs[1]);
			this._wave = periodicWave;
			if (this._oscillator !== null){
				this._oscillator.setPeriodicWave(this._wave);
			}
			this._type = type;
		}
	});

	/**
	 *  Returns the real and imaginary components based
	 *  on the oscillator type.
	 *  @returns {Array} [real, imaginary]
	 *  @private
	 */
	Oscillator.prototype._getRealImaginary = function(type, phase){
		var fftSize = 4096;
		var periodicWaveSize = fftSize / 2;

		var real = new Float32Array(periodicWaveSize);
		var imag = new Float32Array(periodicWaveSize);

		var partialCount = 1;
		if (type === Oscillator.Type.Custom){
			partialCount = this._partials.length + 1;
			periodicWaveSize = partialCount;
		} else {
			var partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
			if (partial){
				partialCount = parseInt(partial[2]) + 1;
				type = partial[1];
				partialCount = Math.max(partialCount, 2);
				periodicWaveSize = partialCount;
			}
		}

		for (var n = 1; n < periodicWaveSize; ++n) {
			var piFactor = 2 / (n * Math.PI);
			var b;
			switch (type) {
				case Oscillator.Type.Sine:
					b = (n <= partialCount) ? 1 : 0;
					break;
				case Oscillator.Type.Square:
					b = (n & 1) ? 2 * piFactor : 0;
					break;
				case Oscillator.Type.Sawtooth:
					b = piFactor * ((n & 1) ? 1 : -1);
					break;
				case Oscillator.Type.Triangle:
					if (n & 1) {
						b = 2 * (piFactor * piFactor) * ((((n - 1) >> 1) & 1) ? -1 : 1);
					} else {
						b = 0;
					}
					break;
				case Oscillator.Type.Custom:
					b = this._partials[n - 1];
					break;
				default:
					throw new TypeError("Oscillator: invalid type: "+type);
			}
			if (b !== 0){
				real[n] = -b * Math.sin(phase * n);
				imag[n] = b * Math.cos(phase * n);
			} else {
				real[n] = 0;
				imag[n] = 0;
			}
		}
		return [real, imag];
	};

	/**
	 *  Compute the inverse FFT for a given phase.
	 *  @param  {Float32Array}  real
	 *  @param  {Float32Array}  imag
	 *  @param  {NormalRange}  phase
	 *  @return  {AudioRange}
	 *  @private
	 */
	Oscillator.prototype._inverseFFT = function(real, imag, phase){
		var sum = 0;
		var len = real.length;
		for (var i = 0; i < len; i++){
			sum += real[i] * Math.cos(i * phase) + imag[i] * Math.sin(i * phase);
		}
		return sum;
	};

	/**
	 *  Returns the initial value of the oscillator.
	 *  @return  {AudioRange}
	 *  @private
	 */
	Oscillator.prototype._getInitialValue = function(){
		var coefs = this._getRealImaginary(this._type, 0);
		var real = coefs[0];
		var imag = coefs[1];
		var maxValue = 0;
		var twoPi = Math.PI * 2;
		//check for peaks in 8 places
		for (var i = 0; i < 8; i++){
			maxValue = Math.max(this._inverseFFT(real, imag, (i / 8) * twoPi), maxValue);
		}
		return -this._inverseFFT(real, imag, this._phase) / maxValue;
	};

	/**
	 * The partials of the waveform. A partial represents
	 * the amplitude at a harmonic. The first harmonic is the
	 * fundamental frequency, the second is the octave and so on
	 * following the harmonic series.
	 * Setting this value will automatically set the type to "custom".
	 * The value is an empty array when the type is not "custom".
	 * @memberOf Oscillator#
	 * @type {Array}
	 * @name partials
	 * @example
	 * osc.partials = [1, 0.2, 0.01];
	 */
	Object.defineProperty(Oscillator.prototype, "partials", {
		get : function(){
			if (this._type !== Oscillator.Type.Custom){
				return [];
			} else {
				return this._partials;
			}
		},
		set : function(partials){
			this._partials = partials;
			this.type = Oscillator.Type.Custom;
		}
	});

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf Oscillator#
	 * @type {Degrees}
	 * @name phase
	 * @example
	 * osc.phase = 180; //flips the phase of the oscillator
	 */
	Object.defineProperty(Oscillator.prototype, "phase", {
		get : function(){
			return this._phase * (180 / Math.PI);
		},
		set : function(phase){
			this._phase = phase * Math.PI / 180;
			//reset the type
			this.type = this._type;
		}
	});

	/**
	 *  Dispose and disconnect.
	 *  @return {Oscillator} this
	 */
	Oscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		if (this._oscillator !== null){
			this._oscillator.disconnect();
			this._oscillator = null;
		}
		this._wave = null;
		this._writable(["frequency", "detune"]);
		this.frequency.dispose();
		this.frequency = null;
		this.detune.dispose();
		this.detune = null;
		this._partials = null;
		return this;
	};
