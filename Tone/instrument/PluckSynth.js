import { Tone } from 'core';
import { Instrument } from 'instrument';
import { Noise } from 'source';
import { LowpassCombFilter } from 'component';

	"use strict";

	/**
	 *  @class Karplus-String string synthesis. Often out of tune.
	 *         Will change when the AudioWorkerNode is available across
	 *         browsers.
	 *
	 *  @constructor
	 *  @extends {Instrument}
	 *  @param {Object} [options] see the defaults
	 *  @example
	 * var plucky = new PluckSynth().toMaster();
	 * plucky.triggerAttack("C4");
	 */
	export function PluckSynth(options){

		options = this.defaultArg(options, PluckSynth.defaults);
		Instrument.call(this, options);

		/**
		 *  @type {Noise}
		 *  @private
		 */
		this._noise = new Noise("pink");

		/**
		 *  The amount of noise at the attack.
		 *  Nominal range of [0.1, 20]
		 *  @type {number}
		 */
		this.attackNoise = options.attackNoise;

		/**
		 *  the LFCF
		 *  @type {LowpassCombFilter}
		 *  @private
		 */
		this._lfcf = new LowpassCombFilter({
			"resonance" : options.resonance,
			"dampening" : options.dampening
		});

		/**
		 *  The resonance control.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.resonance = this._lfcf.resonance;

		/**
		 *  The dampening control. i.e. the lowpass filter frequency of the comb filter
		 *  @type {Frequency}
		 *  @signal
		 */
		this.dampening = this._lfcf.dampening;

		//connections
		this._noise.connect(this._lfcf);
		this._lfcf.connect(this.output);
		this._readOnly(["resonance", "dampening"]);
	};

	Tone.extend(PluckSynth, Instrument);

	/**
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	PluckSynth.defaults = {
		"attackNoise" : 1,
		"dampening" : 4000,
		"resonance" : 0.9
	};

	/**
	 *  Trigger the note.
	 *  @param {Frequency} note The note to trigger.
	 *  @param {Time} [time=now] When the note should be triggered.
	 *  @returns {PluckSynth} this
	 */
	PluckSynth.prototype.triggerAttack = function(note, time) {
		note = this.toFrequency(note);
		time = this.toSeconds(time);
		var delayAmount = 1 / note;
		this._lfcf.delayTime.setValueAtTime(delayAmount, time);
		this._noise.start(time);
		this._noise.stop(time + delayAmount * this.attackNoise);
		return this;
	};

	/**
	 *  Clean up.
	 *  @returns {PluckSynth} this
	 */
	PluckSynth.prototype.dispose = function(){
		Instrument.prototype.dispose.call(this);
		this._noise.dispose();
		this._lfcf.dispose();
		this._noise = null;
		this._lfcf = null;
		this._writable(["resonance", "dampening"]);
		this.dampening = null;
		this.resonance = null;
		return this;
	};
