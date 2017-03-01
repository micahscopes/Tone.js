import { Tone } from 'core';
import { OmniOscillator } from 'source';
import { Instrument } from 'instrument';
import { AmplitudeEnvelope } from 'component';

	"use strict";

	/**
	 *  @class  MembraneSynth makes kick and tom sounds using a single oscillator
	 *          with an amplitude envelope and frequency ramp. A OmniOscillator
	 *          is routed through a AmplitudeEnvelope to the output. The drum
	 *          quality of the sound comes from the frequency envelope applied
	 *          during during MembraneSynth.triggerAttack(note). The frequency
	 *          envelope starts at <code>note * .octaves</code> and ramps to
	 *          <code>note</code> over the duration of <code>.pitchDecay</code>.
	 *
	 *  @constructor
	 *  @extends {Instrument}
	 *  @param {Object} [options] the options available for the synth
	 *                          see defaults below
	 *  @example
	 * var synth = new MembraneSynth().toMaster();
	 * synth.triggerAttackRelease("C2", "8n");
	 */
	export function MembraneSynth(options){

		options = this.defaultArg(options, MembraneSynth.defaults);
		Instrument.call(this, options);

		/**
		 *  The oscillator.
		 *  @type {OmniOscillator}
		 */
		this.oscillator = new OmniOscillator(options.oscillator).start();

		/**
		 *  The amplitude envelope.
		 *  @type {AmplitudeEnvelope}
		 */
		this.envelope = new AmplitudeEnvelope(options.envelope);

		/**
		 *  The number of octaves the pitch envelope ramps.
		 *  @type {Positive}
		 */
		this.octaves = options.octaves;

		/**
		 *  The amount of time the frequency envelope takes.
		 *  @type {Time}
		 */
		this.pitchDecay = options.pitchDecay;

		this.oscillator.chain(this.envelope, this.output);
		this._readOnly(["oscillator", "envelope"]);
	};

	Tone.extend(MembraneSynth, Instrument);

	/**
	 *  @static
	 *  @type {Object}
	 */
	MembraneSynth.defaults = {
		"pitchDecay" : 0.05,
		"octaves" : 10,
		"oscillator" : {
			"type" : "sine",
		},
		"envelope" : {
			"attack" : 0.001,
			"decay" : 0.4,
			"sustain" : 0.01,
			"release" : 1.4,
			"attackCurve" : "exponential"
		}
	};

	/**
	 *  Trigger the note at the given time with the given velocity.
	 *
	 *  @param  {Frequency} note     the note
	 *  @param  {Time} [time=now]     the time, if not given is now
	 *  @param  {number} [velocity=1] velocity defaults to 1
	 *  @returns {MembraneSynth} this
	 *  @example
	 *  kick.triggerAttack(60);
	 */
	MembraneSynth.prototype.triggerAttack = function(note, time, velocity) {
		time = this.toSeconds(time);
		note = this.toFrequency(note);
		var maxNote = note * this.octaves;
		this.oscillator.frequency.setValueAtTime(maxNote, time);
		this.oscillator.frequency.exponentialRampToValueAtTime(note, time + this.toSeconds(this.pitchDecay));
		this.envelope.triggerAttack(time, velocity);
		return this;
	};

	/**
	 *  Trigger the release portion of the note.
	 *
	 *  @param  {Time} [time=now] the time the note will release
	 *  @returns {MembraneSynth} this
	 */
	MembraneSynth.prototype.triggerRelease = function(time){
		this.envelope.triggerRelease(time);
		return this;
	};

	/**
	 *  Clean up.
	 *  @returns {MembraneSynth} this
	 */
	MembraneSynth.prototype.dispose = function(){
		Instrument.prototype.dispose.call(this);
		this._writable(["oscillator", "envelope"]);
		this.oscillator.dispose();
		this.oscillator = null;
		this.envelope.dispose();
		this.envelope = null;
		return this;
	};
