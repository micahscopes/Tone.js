import { Tone } from 'core/Tone';

import { Source } from 'source/Source';

import { Oscillator } from 'source/Oscillator';

import { PulseOscillator } from 'source/PulseOscillator';

import { PWMOscillator } from 'source/PWMOscillator';

import { FMOscillator } from 'source/FMOscillator';

import { AMOscillator } from 'source/AMOscillator';

import { FatOscillator } from 'source/FatOscillator';


	"use strict";

	/**
	 *  @class OmniOscillator aggregates Oscillator, PulseOscillator,
	 *         PWMOscillator, FMOscillator, AMOscillator, and FatOscillator
	 *         into one class. The oscillator class can be changed by setting the `type`.
	 *         `omniOsc.type = "pwm"` will set it to the PWMOscillator. Prefixing
	 *         any of the basic types ("sine", "square4", etc.) with "fm", "am", or "fat"
	 *         will use the FMOscillator, AMOscillator or FatOscillator respectively.
	 *         For example: `omniOsc.type = "fatsawtooth"` will create set the oscillator
	 *         to a FatOscillator of type "sawtooth".
	 *
	 *  @extends {Oscillator}
	 *  @constructor
	 *  @param {Frequency} frequency The initial frequency of the oscillator.
	 *  @param {String} type The type of the oscillator.
	 *  @example
	 *  var omniOsc = new OmniOscillator("C#4", "pwm");
	 */
	export var OmniOscillator = function(){
		var options = this.optionsObject(arguments, ["frequency", "type"], OmniOscillator.defaults);
		Source.call(this, options);

		/**
		 *  The frequency control.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The detune control
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = new Signal(options.detune, Type.Cents);

		/**
		 *  the type of the oscillator source
		 *  @type {String}
		 *  @private
		 */
		this._sourceType = undefined;

		/**
		 *  the oscillator
		 *  @type {Oscillator}
		 *  @private
		 */
		this._oscillator = null;

		//set the oscillator
		this.type = options.type;
		this._readOnly(["frequency", "detune"]);
		//set the options
		this.set(options);
	};

	Tone.extend(OmniOscillator, Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	OmniOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"type" : "sine",
		"phase" : 0,
	};

	/**
	 *  @enum {String}
	 *  @private
	 */
	var OmniOscType = {
		Pulse : "PulseOscillator",
		PWM : "PWMOscillator",
		Osc : "Oscillator",
		FM : "FMOscillator",
		AM : "AMOscillator",
		Fat : "FatOscillator"
	};

	/**
	 *  start the oscillator
	 *  @param {Time} [time=now] the time to start the oscillator
	 *  @private
	 */
	OmniOscillator.prototype._start = function(time){
		this._oscillator.start(time);
	};

	/**
	 *  start the oscillator
	 *  @param {Time} [time=now] the time to start the oscillator
	 *  @private
	 */
	OmniOscillator.prototype._stop = function(time){
		this._oscillator.stop(time);
	};

	/**
	 * The type of the oscillator. Can be any of the basic types: sine, square, triangle, sawtooth. Or
	 * prefix the basic types with "fm", "am", or "fat" to use the FMOscillator, AMOscillator or FatOscillator
	 * types. The oscillator could also be set to "pwm" or "pulse". All of the parameters of the
	 * oscillator's class are accessible when the oscillator is set to that type, but throws an error
	 * when it's not.
	 *
	 * @memberOf OmniOscillator#
	 * @type {String}
	 * @name type
	 * @example
	 * omniOsc.type = "pwm";
	 * //modulationFrequency is parameter which is available
	 * //only when the type is "pwm".
	 * omniOsc.modulationFrequency.value = 0.5;
	 * @example
	 * //an square wave frequency modulated by a sawtooth
	 * omniOsc.type = "fmsquare";
	 * omniOsc.modulationType = "sawtooth";
	 */
	Object.defineProperty(OmniOscillator.prototype, "type", {
		get : function(){
			var prefix = "";
			if (this._sourceType === OmniOscType.FM){
				prefix = "fm";
			} else if (this._sourceType === OmniOscType.AM){
				prefix = "am";
			} else if (this._sourceType === OmniOscType.Fat){
				prefix = "fat";
			}
			return prefix + this._oscillator.type;
		},
		set : function(type){
			if (type.substr(0, 2) === "fm"){
				this._createNewOscillator(OmniOscType.FM);
				this._oscillator.type = type.substr(2);
			} else if (type.substr(0, 2) === "am"){
				this._createNewOscillator(OmniOscType.AM);
				this._oscillator.type = type.substr(2);
			} else if (type.substr(0, 3) === "fat"){
				this._createNewOscillator(OmniOscType.Fat);
				this._oscillator.type = type.substr(3);
			} else if (type === "pwm"){
				this._createNewOscillator(OmniOscType.PWM);
			} else if (type === "pulse"){
				this._createNewOscillator(OmniOscType.Pulse);
			} else {
				this._createNewOscillator(OmniOscType.Osc);
				this._oscillator.type = type;
			}
		}
	});

	/**
	 * The partials of the waveform. A partial represents
	 * the amplitude at a harmonic. The first harmonic is the
	 * fundamental frequency, the second is the octave and so on
	 * following the harmonic series.
	 * Setting this value will automatically set the type to "custom".
	 * The value is an empty array when the type is not "custom".
	 * This is not available on "pwm" and "pulse" oscillator types.
	 * @memberOf OmniOscillator#
	 * @type {Array}
	 * @name partials
	 * @example
	 * osc.partials = [1, 0.2, 0.01];
	 */
	Object.defineProperty(OmniOscillator.prototype, "partials", {
		get : function(){
			return this._oscillator.partials;
		},
		set : function(partials){
			this._oscillator.partials = partials;
		}
	});

	/**
	 *  Set a member/attribute of the oscillator.
	 *  @param {Object|String} params
	 *  @param {number=} value
	 *  @param {Time=} rampTime
	 *  @returns {OmniOscillator} this
	 */
	OmniOscillator.prototype.set = function(params, value){
		//make sure the type is set first
		if (params === "type"){
			this.type = value;
		} else if (this.isObject(params) && params.hasOwnProperty("type")){
			this.type = params.type;
		}
		//then set the rest
		prototype.set.apply(this, arguments);
		return this;
	};

	/**
	 *  connect the oscillator to the frequency and detune signals
	 *  @private
	 */
	OmniOscillator.prototype._createNewOscillator = function(oscType){
		if (oscType !== this._sourceType){
			this._sourceType = oscType;
			var OscillatorConstructor = Tone[oscType];
			//short delay to avoid clicks on the change
			var now = this.now() + this.blockTime;
			if (this._oscillator !== null){
				var oldOsc = this._oscillator;
				oldOsc.stop(now);
				//dispose the old one
				setTimeout(function(){
					oldOsc.dispose();
					oldOsc = null;
				}, this.blockTime * 1000);
			}
			this._oscillator = new OscillatorConstructor();
			this.frequency.connect(this._oscillator.frequency);
			this.detune.connect(this._oscillator.detune);
			this._oscillator.connect(this.output);
			if (this.state === State.Started){
				this._oscillator.start(now);
			}
		}
	};

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf OmniOscillator#
	 * @type {Degrees}
	 * @name phase
	 */
	Object.defineProperty(OmniOscillator.prototype, "phase", {
		get : function(){
			return this._oscillator.phase;
		},
		set : function(phase){
			this._oscillator.phase = phase;
		}
	});

	/**
	 * The width of the oscillator (only if the oscillator is set to "pulse")
	 * @memberOf OmniOscillator#
	 * @type {NormalRange}
	 * @signal
	 * @name width
	 * @example
	 * var omniOsc = new OmniOscillator(440, "pulse");
	 * //can access the width attribute only if type === "pulse"
	 * omniOsc.width.value = 0.2;
	 */
	Object.defineProperty(OmniOscillator.prototype, "width", {
		get : function(){
			if (this._sourceType === OmniOscType.Pulse){
				return this._oscillator.width;
			}
		}
	});

	/**
	 * The number of detuned oscillators
	 * @memberOf OmniOscillator#
	 * @type {Number}
	 * @name count
	 */
	Object.defineProperty(OmniOscillator.prototype, "count", {
		get : function(){
			if (this._sourceType === OmniOscType.Fat){
				return this._oscillator.count;
			}
		},
		set : function(count){
			if (this._sourceType === OmniOscType.Fat){
				this._oscillator.count = count;
			}
		}
	});

	/**
	 * The detune spread between the oscillators. If "count" is
	 * set to 3 oscillators and the "spread" is set to 40,
	 * the three oscillators would be detuned like this: [-20, 0, 20]
	 * for a total detune spread of 40 cents. See FatOscillator
	 * for more info.
	 * @memberOf OmniOscillator#
	 * @type {Cents}
	 * @name spread
	 */
	Object.defineProperty(OmniOscillator.prototype, "spread", {
		get : function(){
			if (this._sourceType === OmniOscType.Fat){
				return this._oscillator.spread;
			}
		},
		set : function(spread){
			if (this._sourceType === OmniOscType.Fat){
				this._oscillator.spread = spread;
			}
		}
	});

	/**
	 * The type of the modulator oscillator. Only if the oscillator
	 * is set to "am" or "fm" types. see. AMOscillator or FMOscillator
	 * for more info.
	 * @memberOf OmniOscillator#
	 * @type {String}
	 * @name modulationType
	 */
	Object.defineProperty(OmniOscillator.prototype, "modulationType", {
		get : function(){
			if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
				return this._oscillator.modulationType;
			}
		},
		set : function(mType){
			if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
				this._oscillator.modulationType = mType;
			}
		}
	});

	/**
	 * The modulation index which is in essence the depth or amount of the modulation. In other terms it is the
	 * ratio of the frequency of the modulating signal (mf) to the amplitude of the
	 * modulating signal (ma) -- as in ma/mf.
	 * See FMOscillator for more info.
	 * @type {Positive}
	 * @signal
	 * @name modulationIndex
	 */
	Object.defineProperty(OmniOscillator.prototype, "modulationIndex", {
		get : function(){
			if (this._sourceType === OmniOscType.FM){
				return this._oscillator.modulationIndex;
			}
		}
	});

	/**
	 *  Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
	 *  A harmonicity of 1 gives both oscillators the same frequency.
	 *  Harmonicity = 2 means a change of an octave. See AMOscillator or FMOscillator
	 *  for more info.
	 *  @memberOf OmniOscillator#
	 *  @signal
	 *  @type {Positive}
	 *  @name harmonicity
	 */
	Object.defineProperty(OmniOscillator.prototype, "harmonicity", {
		get : function(){
			if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
				return this._oscillator.harmonicity;
			}
		}
	});

	/**
	 * The modulationFrequency Signal of the oscillator
	 * (only if the oscillator type is set to pwm). See
	 * PWMOscillator for more info.
	 * @memberOf OmniOscillator#
	 * @type {Frequency}
	 * @signal
	 * @name modulationFrequency
	 * @example
	 * var omniOsc = new OmniOscillator(440, "pwm");
	 * //can access the modulationFrequency attribute only if type === "pwm"
	 * omniOsc.modulationFrequency.value = 0.2;
	 */
	Object.defineProperty(OmniOscillator.prototype, "modulationFrequency", {
		get : function(){
			if (this._sourceType === OmniOscType.PWM){
				return this._oscillator.modulationFrequency;
			}
		}
	});

	/**
	 *  Clean up.
	 *  @return {OmniOscillator} this
	 */
	OmniOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._writable(["frequency", "detune"]);
		this.detune.dispose();
		this.detune = null;
		this.frequency.dispose();
		this.frequency = null;
		this._oscillator.dispose();
		this._oscillator = null;
		this._sourceType = null;
		return this;
	};
