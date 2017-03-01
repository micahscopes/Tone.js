import { Tone } from 'core/Tone';

import { Type } from 'type/Type';


	"use strict";

	/**
	 *  @class  Base-class for all instruments
	 *
	 *  @constructor
	 *  @extends {Tone}
	 */
	export var Instrument = function(options){

		//get the defaults
		options = this.defaultArg(options, Instrument.defaults);

		/**
		 *  The output and volume triming node
		 *  @type  {Volume}
		 *  @private
		 */
		this._volume = this.output = new Volume(options.volume);

		/**
		 * The volume of the output in decibels.
		 * @type {Decibels}
		 * @signal
		 * @example
		 * source.volume.value = -6;
		 */
		this.volume = this._volume.volume;
		this._readOnly("volume");
	};

	Tone.extend(Instrument);

	/**
	 *  the default attributes
	 *  @type {object}
	 */
	Instrument.defaults = {
		/** the volume of the output in decibels */
		"volume" : 0
	};

	/**
	 *  @abstract
	 *  @param {string|number} note the note to trigger
	 *  @param {Time} [time=now] the time to trigger the ntoe
	 *  @param {number} [velocity=1] the velocity to trigger the note
	 */
	Instrument.prototype.triggerAttack = Tone.noOp;

	/**
	 *  @abstract
	 *  @param {Time} [time=now] when to trigger the release
	 */
	Instrument.prototype.triggerRelease = Tone.noOp;

	/**
	 *  Trigger the attack and then the release after the duration.
	 *  @param  {Frequency} note     The note to trigger.
	 *  @param  {Time} duration How long the note should be held for before
	 *                          triggering the release.
	 *  @param {Time} [time=now]  When the note should be triggered.
	 *  @param  {NormalRange} [velocity=1] The velocity the note should be triggered at.
	 *  @returns {Instrument} this
	 *  @example
	 * //trigger "C4" for the duration of an 8th note
	 * synth.triggerAttackRelease("C4", "8n");
	 */
	Instrument.prototype.triggerAttackRelease = function(note, duration, time, velocity){
		if (this.isUndef(time)){
			time = this.now() + this.blockTime;
		} else {
			time = this.toSeconds(time);
		}
		duration = this.toSeconds(duration);
		this.triggerAttack(note, time, velocity);
		this.triggerRelease(time + duration);
		return this;
	};

	/**
	 *  clean up
	 *  @returns {Instrument} this
	 */
	Instrument.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._volume.dispose();
		this._volume = null;
		this._writable(["volume"]);
		this.volume = null;
		return this;
	};
