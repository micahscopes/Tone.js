import { Tone } from 'core/Tone';

import { Source } from 'source/Source';

import { Oscillator } from 'source/Oscillator';

import { Multiply } from 'signal/Multiply';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class FMOscillator
	 *
	 *  @extends {Oscillator}
	 *  @constructor
	 *  @param {Frequency} frequency The starting frequency of the oscillator.
	 *  @param {String} type The type of the carrier oscillator.
	 *  @param {String} modulationType The type of the modulator oscillator.
	 *  @example
	 * //a sine oscillator frequency-modulated by a square wave
	 * var fmOsc = new FMOscillator("Ab3", "sine", "square").toMaster().start();
	 */
	export var FMOscillator = function(){

		var options = this.optionsObject(arguments, ["frequency", "type", "modulationType"], FMOscillator.defaults);
		Source.call(this, options);

		/**
		 *  The carrier oscillator
		 *  @type {Oscillator}
		 *  @private
		 */
		this._carrier = new Oscillator(options.frequency, options.type);

		/**
		 *  The oscillator's frequency
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The detune control signal.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = this._carrier.detune;
		this.detune.value = options.detune;

		/**
		 *  The modulation index which is in essence the depth or amount of the modulation. In other terms it is the
		 *  ratio of the frequency of the modulating signal (mf) to the amplitude of the
		 *  modulating signal (ma) -- as in ma/mf.
		 *	@type {Positive}
		 *	@signal
		 */
		this.modulationIndex = new Multiply(options.modulationIndex);
		this.modulationIndex.units = Type.Positive;

		/**
		 *  The modulating oscillator
		 *  @type  {Oscillator}
		 *  @private
		 */
		this._modulator = new Oscillator(options.frequency, options.modulationType);

		/**
		 *  Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
		 *  A harmonicity of 1 gives both oscillators the same frequency.
		 *  Harmonicity = 2 means a change of an octave.
		 *  @type {Positive}
		 *  @signal
		 *  @example
		 * //pitch the modulator an octave below carrier
		 * synth.harmonicity.value = 0.5;
		 */
		this.harmonicity = new Multiply(options.harmonicity);
		this.harmonicity.units = Type.Positive;

		/**
		 *  the node where the modulation happens
		 *  @type {Gain}
		 *  @private
		 */
		this._modulationNode = new Gain(0);

		//connections
		this.frequency.connect(this._carrier.frequency);
		this.frequency.chain(this.harmonicity, this._modulator.frequency);
		this.frequency.chain(this.modulationIndex, this._modulationNode);
		this._modulator.connect(this._modulationNode.gain);
		this._modulationNode.connect(this._carrier.frequency);
		this._carrier.connect(this.output);
		this.detune.connect(this._modulator.detune);

		this.phase = options.phase;

		this._readOnly(["modulationIndex", "frequency", "detune", "harmonicity"]);
	};

	Tone.extend(FMOscillator, Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	FMOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"modulationIndex" : 2,
		"modulationType" : "square",
		"harmonicity" : 1
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now]
	 *  @private
	 */
	FMOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._modulator.start(time);
		this._carrier.start(time);
	};

	/**
	 *  stop the oscillator
	 *  @param  {Time} time (optional) timing parameter
	 *  @private
	 */
	FMOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._modulator.stop(time);
		this._carrier.stop(time);
	};

	/**
	 * The type of the carrier oscillator
	 * @memberOf FMOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(FMOscillator.prototype, "type", {
		get : function(){
			return this._carrier.type;
		},
		set : function(type){
			this._carrier.type = type;
		}
	});

	/**
	 * The type of the modulator oscillator
	 * @memberOf FMOscillator#
	 * @type {String}
	 * @name modulationType
	 */
	Object.defineProperty(FMOscillator.prototype, "modulationType", {
		get : function(){
			return this._modulator.type;
		},
		set : function(type){
			this._modulator.type = type;
		}
	});

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf FMOscillator#
	 * @type {number}
	 * @name phase
	 */
	Object.defineProperty(FMOscillator.prototype, "phase", {
		get : function(){
			return this._carrier.phase;
		},
		set : function(phase){
			this._carrier.phase = phase;
			this._modulator.phase = phase;
		}
	});

	/**
	 * The partials of the carrier waveform. A partial represents
	 * the amplitude at a harmonic. The first harmonic is the
	 * fundamental frequency, the second is the octave and so on
	 * following the harmonic series.
	 * Setting this value will automatically set the type to "custom".
	 * The value is an empty array when the type is not "custom".
	 * @memberOf FMOscillator#
	 * @type {Array}
	 * @name partials
	 * @example
	 * osc.partials = [1, 0.2, 0.01];
	 */
	Object.defineProperty(FMOscillator.prototype, "partials", {
		get : function(){
			return this._carrier.partials;
		},
		set : function(partials){
			this._carrier.partials = partials;
		}
	});

	/**
	 *  Clean up.
	 *  @return {FMOscillator} this
	 */
	FMOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._writable(["modulationIndex", "frequency", "detune", "harmonicity"]);
		this.frequency.dispose();
		this.frequency = null;
		this.detune = null;
		this.harmonicity.dispose();
		this.harmonicity = null;
		this._carrier.dispose();
		this._carrier = null;
		this._modulator.dispose();
		this._modulator = null;
		this._modulationNode.dispose();
		this._modulationNode = null;
		this.modulationIndex.dispose();
		this.modulationIndex = null;
		return this;
	};
