import { Tone } from 'core';
import { Source } from 'source';
import { Oscillator } from 'source';
import { Multiply } from 'signal';
import { Gain } from 'core';
import { AudioToGain } from 'signal';

	"use strict";

	/**
	 *  @class AMOscillator
	 *
	 *  @extends {Oscillator}
	 *  @constructor
	 *  @param {Frequency} frequency The starting frequency of the oscillator.
	 *  @param {String} type The type of the carrier oscillator.
	 *  @param {String} modulationType The type of the modulator oscillator.
	 *  @example
	 * //a sine oscillator frequency-modulated by a square wave
	 * var fmOsc = new AMOscillator("Ab3", "sine", "square").toMaster().start();
	 */
	export function AMOscillator(){

		var options = this.optionsObject(arguments, ["frequency", "type", "modulationType"], AMOscillator.defaults);
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
		this.frequency = this._carrier.frequency;

		/**
		 *  The detune control signal.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = this._carrier.detune;
		this.detune.value = options.detune;

		/**
		 *  The modulating oscillator
		 *  @type  {Oscillator}
		 *  @private
		 */
		this._modulator = new Oscillator(options.frequency, options.modulationType);

		/**
		 *  convert the -1,1 output to 0,1
		 *  @type {AudioToGain}
		 *  @private
		 */
		this._modulationScale = new AudioToGain();

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
		this.frequency.chain(this.harmonicity, this._modulator.frequency);
		this.detune.connect(this._modulator.detune);
		this._modulator.chain(this._modulationScale, this._modulationNode.gain);
		this._carrier.chain(this._modulationNode, this.output);

		this.phase = options.phase;

		this._readOnly(["frequency", "detune", "harmonicity"]);
	};

	Tone.extend(AMOscillator, Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	AMOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"modulationType" : "square",
		"harmonicity" : 1
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now]
	 *  @private
	 */
	AMOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._modulator.start(time);
		this._carrier.start(time);
	};

	/**
	 *  stop the oscillator
	 *  @param  {Time} time (optional) timing parameter
	 *  @private
	 */
	AMOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._modulator.stop(time);
		this._carrier.stop(time);
	};

	/**
	 * The type of the carrier oscillator
	 * @memberOf AMOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(AMOscillator.prototype, "type", {
		get : function(){
			return this._carrier.type;
		},
		set : function(type){
			this._carrier.type = type;
		}
	});

	/**
	 * The type of the modulator oscillator
	 * @memberOf AMOscillator#
	 * @type {string}
	 * @name modulationType
	 */
	Object.defineProperty(AMOscillator.prototype, "modulationType", {
		get : function(){
			return this._modulator.type;
		},
		set : function(type){
			this._modulator.type = type;
		}
	});

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf AMOscillator#
	 * @type {number}
	 * @name phase
	 */
	Object.defineProperty(AMOscillator.prototype, "phase", {
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
	 * @memberOf AMOscillator#
	 * @type {Array}
	 * @name partials
	 * @example
	 * osc.partials = [1, 0.2, 0.01];
	 */
	Object.defineProperty(AMOscillator.prototype, "partials", {
		get : function(){
			return this._carrier.partials;
		},
		set : function(partials){
			this._carrier.partials = partials;
		}
	});

	/**
	 *  Clean up.
	 *  @return {AMOscillator} this
	 */
	AMOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._writable(["frequency", "detune", "harmonicity"]);
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
		this._modulationScale.dispose();
		this._modulationScale = null;
		return this;
	};
