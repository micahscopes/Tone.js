import { Tone } from 'core/Tone';

import { Panner } from 'component/Panner';

import { Volume } from 'component/Volume';


	"use strict";

	/**
	 *  @class PanVol is a Panner and Volume in one.
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {AudioRange} pan the initial pan
	 *  @param {number} volume The output volume.
	 *  @example
	 * //pan the incoming signal left and drop the volume
	 * var panVol = new PanVol(0.25, -12);
	 */
	export var PanVol = function(){

		var options = this.optionsObject(arguments, ["pan", "volume"], PanVol.defaults);

		/**
		 *  The panning node
		 *  @type {Panner}
		 *  @private
		 */
		this._panner = this.input = new Panner(options.pan);

		/**
		 *  The L/R panning control.
		 *  @type {AudioRange}
		 *  @signal
		 */
		this.pan = this._panner.pan;

		/**
		 *  The volume node
		 *  @type {Volume}
		 */
		this._volume = this.output = new Volume(options.volume);

		/**
		 *  The volume control in decibels.
		 *  @type {Decibels}
		 *  @signal
		 */
		this.volume = this._volume.volume;

		//connections
		this._panner.connect(this._volume);

		this._readOnly(["pan", "volume"]);
	};

	Tone.extend(PanVol);

	/**
	 *  The defaults
	 *  @type  {Object}
	 *  @const
	 *  @static
	 */
	PanVol.defaults = {
		"pan" : 0.5,
		"volume" : 0
	};

	/**
	 *  clean up
	 *  @returns {PanVol} this
	 */
	PanVol.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable(["pan", "volume"]);
		this._panner.dispose();
		this._panner = null;
		this.pan = null;
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
		return this;
	};
