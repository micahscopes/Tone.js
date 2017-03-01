import { Tone } from 'core';
import { Instrument } from 'instrument';
import { Signal } from 'signal';

	"use strict";

	/**
	 *  @class  This is an abstract base class for other monophonic instruments to
	 *          extend. IMPORTANT: It does not make any sound on its own and
	 *          shouldn't be directly instantiated.
	 *
	 *  @constructor
	 *  @abstract
	 *  @extends {Instrument}
	 */
	export function Monophonic(options){

		//get the defaults
		options = this.defaultArg(options, Monophonic.defaults);

		Instrument.call(this, options);

		/**
		 *  The glide time between notes.
		 *  @type {Time}
		 */
		this.portamento = options.portamento;
	};

	Tone.extend(Monophonic, Instrument);

	/**
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Monophonic.defaults = {
		"portamento" : 0
	};

	/**
	 *  Trigger the attack of the note optionally with a given velocity.
	 *
	 *
	 *  @param  {Frequency} note     The note to trigger.
	 *  @param  {Time} [time=now]     When the note should start.
	 *  @param  {number} [velocity=1] velocity The velocity scaler
	 *                                determines how "loud" the note
	 *                                will be triggered.
	 *  @returns {Monophonic} this
	 *  @example
	 * synth.triggerAttack("C4");
	 *  @example
	 * //trigger the note a half second from now at half velocity
	 * synth.triggerAttack("C4", "+0.5", 0.5);
	 */
	Monophonic.prototype.triggerAttack = function(note, time, velocity) {
		if (this.isUndef(time)){
			time = this.now() + this.blockTime;
		} else {
			time = this.toSeconds(time);
		}
		this._triggerEnvelopeAttack(time, velocity);
		this.setNote(note, time);
		return this;
	};

	/**
	 *  Trigger the release portion of the envelope
	 *  @param  {Time} [time=now] If no time is given, the release happens immediatly
	 *  @returns {Monophonic} this
	 *  @example
	 * synth.triggerRelease();
	 */
	Monophonic.prototype.triggerRelease = function(time){
		if (this.isUndef(time)){
			time = this.now() + this.blockTime;
		} else {
			time = this.toSeconds(time);
		}
		this._triggerEnvelopeRelease(time);
		return this;
	};

	/**
	 *  override this method with the actual method
	 *  @abstract
	 *  @private
	 */
	Monophonic.prototype._triggerEnvelopeAttack = function() {};

	/**
	 *  override this method with the actual method
	 *  @abstract
	 *  @private
	 */
	Monophonic.prototype._triggerEnvelopeRelease = function() {};

	/**
	 *  Set the note at the given time. If no time is given, the note
	 *  will set immediately.
	 *  @param {Frequency} note The note to change to.
	 *  @param  {Time} [time=now] The time when the note should be set.
	 *  @returns {Monophonic} this
	 * @example
	 * //change to F#6 in one quarter note from now.
	 * synth.setNote("F#6", "+4n");
	 * @example
	 * //change to Bb4 right now
	 * synth.setNote("Bb4");
	 */
	Monophonic.prototype.setNote = function(note, time){
		time = this.toSeconds(time);
		if (this.portamento > 0){
			var currentNote = this.frequency.value;
			this.frequency.setValueAtTime(currentNote, time);
			var portTime = this.toSeconds(this.portamento);
			this.frequency.exponentialRampToValueAtTime(note, time + portTime);
		} else {
			this.frequency.setValueAtTime(note, time);
		}
		return this;
	};
