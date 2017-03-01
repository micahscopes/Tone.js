import { Tone } from 'core';
import { Instrument } from 'instrument';
import { FMOscillator } from 'source';
import { Filter } from 'component';
import { FrequencyEnvelope } from 'component';
import { AmplitudeEnvelope } from 'component';
import { Gain } from 'core';
import { Scale } from 'signal';
import { Multiply } from 'signal';

	/**
	 *  Inharmonic ratio of frequencies based on the Roland TR-808
	 *  Taken from https://ccrma.stanford.edu/papers/tr-808-cymbal-physically-informed-circuit-bendable-digital-model
	 *  @private
	 *  @static
	 *  @type {Array}
	 */
	var inharmRatios = [1.0, 1.483, 1.932, 2.546, 2.630, 3.897];

	/**
	 *  @class  A highly inharmonic and spectrally complex source with a highpass filter
	 *          and amplitude envelope which is good for making metalophone sounds. Based
	 *          on CymbalSynth by [@polyrhythmatic](https://github.com/polyrhythmatic).
	 *          Inspiration from [Sound on Sound](http://www.soundonsound.com/sos/jul02/articles/synthsecrets0702.asp).
	 *
	 *  @constructor
	 *  @extends {Instrument}
	 *  @param {Object} [options] The options availble for the synth
	 *                             see defaults below
	 */
	export function MetalSynth(options){

		options = this.defaultArg(options, MetalSynth.defaults);
		Instrument.call(this, options);

		/**
		 *  The frequency of the cymbal
		 *  @type  {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The array of FMOscillators
		 *  @type  {Array}
		 *  @private
		 */
		this._oscillators = [];

		/**
		 *  The frequency multipliers
		 *  @type {Array}
		 *  @private
		 */
		this._freqMultipliers = [];

		/**
		 *  The amplitude for the body
		 *  @type {Gain}
		 *  @private
		 */
		this._amplitue = new Gain(0).connect(this.output);

		/**
		 *  highpass the output
		 *  @type {Filter}
		 *  @private
		 */
		this._highpass = new Filter({
			"type" : "highpass",
			"Q" : -3.0102999566398125
		}).connect(this._amplitue);

		/**
		 *  The number of octaves the highpass
		 *  filter frequency ramps
		 *  @type {Number}
		 *  @private
		 */
		this._octaves = options.octaves;

		/**
		 *  Scale the body envelope
		 *  for the bandpass
		 *  @type {Scale}
		 *  @private
		 */
		this._filterFreqScaler = new Scale(options.resonance, 7000);

		/**
		 *  The envelope which is connected both to the
		 *  amplitude and highpass filter's cutoff frequency
		 *  @type  {Envelope}
		 */
		this.envelope = new Envelope({
			"attack" : options.envelope.attack,
			"attackCurve" : "linear",
			"decay" : options.envelope.decay,
			"sustain" : 0,
			"release" : options.envelope.release,
		}).chain(this._filterFreqScaler, this._highpass.frequency);
		this.envelope.connect(this._amplitue.gain);

		for (var i = 0; i < inharmRatios.length; i++){
			var osc = new FMOscillator({
				"type" : "square",
				"modulationType" : "square",
				"harmonicity" : options.harmonicity,
				"modulationIndex" : options.modulationIndex
			});
			osc.connect(this._highpass).start(0);
			this._oscillators[i] = osc;

			var mult = new Multiply(inharmRatios[i]);
			this._freqMultipliers[i] = mult;
			this.frequency.chain(mult, osc.frequency);
		}

		//set the octaves
		this.octaves = options.octaves;

	};

	Tone.extend(MetalSynth, Instrument);

	/**
	 *  default values
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	MetalSynth.defaults = {
		"frequency" : 200,
		"envelope" : {
			"attack" : 0.001,
			"decay" : 1.4,
			"release" : 0.2
		},
		"harmonicity" : 5.1,
		"modulationIndex" : 32,
		"resonance" : 4000,
		"octaves" : 1.5
	};

	/**
	 *  Trigger the attack.
	 *  @param  {Time}  time      When the attack should be triggered.
	 *  @param  {NormalRange=1}  velocity  The velocity that the envelope should be triggered at.
	 *  @return  {MetalSynth}  this
	 */
	MetalSynth.prototype.triggerAttack = function(time, vel) {
		time = this.toSeconds(time);
		vel = this.defaultArg(vel, 1);
		this.envelope.triggerAttack(time, vel);
		return this;
	};

	/**
	 *  Trigger the release of the envelope.
	 *  @param  {Time}  time      When the release should be triggered.
	 *  @return  {MetalSynth}  this
	 */
	MetalSynth.prototype.triggerRelease = function(time) {
		time = this.toSeconds(time);
		this.envelope.triggerRelease(time);
		return this;
	};

	/**
	 *  Trigger the attack and release of the envelope after the given
	 *  duration.
	 *  @param  {Time}  duration  The duration before triggering the release
	 *  @param  {Time}  time      When the attack should be triggered.
	 *  @param  {NormalRange=1}  velocity  The velocity that the envelope should be triggered at.
	 *  @return  {MetalSynth}  this
	 */
	MetalSynth.prototype.triggerAttackRelease = function(duration, time, velocity) {
		time = this.toSeconds(time);
		duration = this.toSeconds(duration);
		this.triggerAttack(time, velocity);
		this.triggerRelease(time + duration);
		return this;
	};

	/**
	 *  The modulationIndex of the oscillators which make up the source.
	 *  see FMOscillator.modulationIndex
	 *  @memberOf MetalSynth#
	 *  @type {Positive}
	 *  @name  modulationIndex
	 */
	Object.defineProperty(MetalSynth.prototype, "modulationIndex", {
		get : function(){
			return this._oscillators[0].modulationIndex.value;
		},
		set : function(val){
			for (var i = 0; i < this._oscillators.length; i++){
				this._oscillators[i].modulationIndex.value = val;
			}
		}
	});

	/**
	 *  The harmonicity of the oscillators which make up the source.
	 *  see FMOscillator.harmonicity
	 *  @memberOf MetalSynth#
	 *  @type {Positive}
	 *  @name  harmonicity
	 */
	Object.defineProperty(MetalSynth.prototype, "harmonicity", {
		get : function(){
			return this._oscillators[0].harmonicity.value;
		},
		set : function(val){
			for (var i = 0; i < this._oscillators.length; i++){
				this._oscillators[i].harmonicity.value = val;
			}
		}
	});

	/**
	 *  The frequency of the highpass filter attached to the envelope
	 *  @memberOf MetalSynth#
	 *  @type {Frequency}
	 *  @name  resonance
	 */
	Object.defineProperty(MetalSynth.prototype, "resonance", {
		get : function(){
			return this._filterFreqScaler.min;
		},
		set : function(val){
			this._filterFreqScaler.min = val;
			this.octaves = this._octaves;
		}
	});

	/**
	 *  The number of octaves above the "resonance" frequency
	 *  that the filter ramps during the attack/decay envelope
	 *  @memberOf MetalSynth#
	 *  @type {Number}
	 *  @name  octaves
	 */
	Object.defineProperty(MetalSynth.prototype, "octaves", {
		get : function(){
			return this._octaves;
		},
		set : function(octs){
			this._octaves = octs;
			this._filterFreqScaler.max = this._filterFreqScaler.min * Math.pow(2, octs);
		}
	});

	/**
	 *  Clean up
	 *  @returns {MetalSynth} this
	 */
	MetalSynth.prototype.dispose = function(){
		Instrument.prototype.dispose.call(this);
		for (var i = 0; i < this._oscillators.length; i++){
			this._oscillators[i].dispose();
			this._freqMultipliers[i].dispose();
		}
		this._oscillators = null;
		this._freqMultipliers = null;
		this.frequency.dispose();
		this.frequency = null;
		this._filterFreqScaler.dispose();
		this._filterFreqScaler = null;
		this._amplitue.dispose();
		this._amplitue = null;
		this.envelope.dispose();
		this.envelope = null;
		this._highpass.dispose();
		this._highpass = null;
	};
