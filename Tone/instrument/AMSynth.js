import { Tone } from 'core';
import { Synth } from 'instrument';
import { Signal } from 'signal';
import { Multiply } from 'signal';
import { Monophonic } from 'instrument';
import { AudioToGain } from 'signal';
import { Gain } from 'core';

	"use strict";

	/**
	 *  @class  AMSynth uses the output of one Synth to modulate the
	 *          amplitude of another Synth. The harmonicity (the ratio between
	 *          the two signals) affects the timbre of the output signal greatly.
	 *          Read more about Amplitude Modulation Synthesis on
	 *          [SoundOnSound](http://www.soundonsound.com/sos/mar00/articles/synthsecrets.htm).
	 *          <img src="https://docs.google.com/drawings/d/1TQu8Ed4iFr1YTLKpB3U1_hur-UwBrh5gdBXc8BxfGKw/pub?w=1009&h=457">
	 *
	 *  @constructor
	 *  @extends {Monophonic}
	 *  @param {Object} [options] the options available for the synth
	 *                            see defaults below
	 *  @example
	 * var synth = new AMSynth().toMaster();
	 * synth.triggerAttackRelease("C4", "4n");
	 */
	export function AMSynth(options){

		options = this.defaultArg(options, AMSynth.defaults);
		Monophonic.call(this, options);

		/**
		 *  The carrier voice.
		 *  @type {Synth}
		 *  @private
		 */
		this._carrier = new Synth();
		this._carrier.volume.value = -10;

		/**
		 *  The carrier's oscillator
		 *  @type {Oscillator}
		 */
		this.oscillator = this._carrier.oscillator;

		/**
		 *  The carrier's envelope
		 *  @type {AmplitudeEnvelope}
		 */
		this.envelope = this._carrier.envelope.set(options.envelope);

		/**
		 *  The modulator voice.
		 *  @type {Synth}
		 *  @private
		 */
		this._modulator = new Synth();
		this._modulator.volume.value = -10;

		/**
		 *  The modulator's oscillator which is applied
		 *  to the amplitude of the oscillator
		 *  @type {Oscillator}
		 */
		this.modulation = this._modulator.oscillator.set(options.modulation);

		/**
		 *  The modulator's envelope
		 *  @type {AmplitudeEnvelope}
		 */
		this.modulationEnvelope = this._modulator.envelope.set(options.modulationEnvelope);

		/**
		 *  The frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(440, Type.Frequency);

		/**
		 *  The detune in cents
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = new Signal(options.detune, Type.Cents);

		/**
		 *  Harmonicity is the ratio between the two voices. A harmonicity of
		 *  1 is no change. Harmonicity = 2 means a change of an octave.
		 *  @type {Positive}
		 *  @signal
		 *  @example
		 * //pitch voice1 an octave below voice0
		 * synth.harmonicity.value = 0.5;
		 */
		this.harmonicity = new Multiply(options.harmonicity);
		this.harmonicity.units = Type.Positive;

		/**
		 *  convert the -1,1 output to 0,1
		 *  @type {AudioToGain}
		 *  @private
		 */
		this._modulationScale = new AudioToGain();

		/**
		 *  the node where the modulation happens
		 *  @type {Gain}
		 *  @private
		 */
		this._modulationNode = new Gain();

		//control the two voices frequency
		this.frequency.connect(this._carrier.frequency);
		this.frequency.chain(this.harmonicity, this._modulator.frequency);
		this.detune.fan(this._carrier.detune, this._modulator.detune);
		this._modulator.chain(this._modulationScale, this._modulationNode.gain);
		this._carrier.chain(this._modulationNode, this.output);
		this._readOnly(["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
	};

	Tone.extend(AMSynth, Monophonic);

	/**
	 *  @static
	 *  @type {Object}
	 */
	AMSynth.defaults = {
		"harmonicity" : 3,
		"detune" : 0,
		"oscillator" : {
			"type" : "sine"
		},
		"envelope" : {
			"attack" : 0.01,
			"decay" : 0.01,
			"sustain" : 1,
			"release" : 0.5
		},
		"modulation" : {
			"type" : "square"
		},
		"modulationEnvelope" : {
			"attack" : 0.5,
			"decay" : 0.0,
			"sustain" : 1,
			"release" : 0.5
		}
	};

	/**
	 *  trigger the attack portion of the note
	 *
	 *  @param  {Time} [time=now] the time the note will occur
	 *  @param {NormalRange} [velocity=1] the velocity of the note
	 *  @private
	 *  @returns {AMSynth} this
	 */
	AMSynth.prototype._triggerEnvelopeAttack = function(time, velocity){
		//the port glide
		time = this.toSeconds(time);
		//the envelopes
		this.envelope.triggerAttack(time, velocity);
		this.modulationEnvelope.triggerAttack(time, velocity);
		return this;
	};

	/**
	 *  trigger the release portion of the note
	 *
	 *  @param  {Time} [time=now] the time the note will release
	 *  @private
	 *  @returns {AMSynth} this
	 */
	AMSynth.prototype._triggerEnvelopeRelease = function(time){
		this.envelope.triggerRelease(time);
		this.modulationEnvelope.triggerRelease(time);
		return this;
	};

	/**
	 *  clean up
	 *  @returns {AMSynth} this
	 */
	AMSynth.prototype.dispose = function(){
		Monophonic.prototype.dispose.call(this);
		this._writable(["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
		this._carrier.dispose();
		this._carrier = null;
		this._modulator.dispose();
		this._modulator = null;
		this.frequency.dispose();
		this.frequency = null;
		this.detune.dispose();
		this.detune = null;
		this.harmonicity.dispose();
		this.harmonicity = null;
		this._modulationScale.dispose();
		this._modulationScale = null;
		this._modulationNode.dispose();
		this._modulationNode = null;
		this.oscillator = null;
		this.envelope = null;
		this.modulationEnvelope = null;
		this.modulation = null;
		return this;
	};
