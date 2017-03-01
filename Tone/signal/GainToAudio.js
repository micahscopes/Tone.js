import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';

import { Signal } from 'signal/Signal';


	"use strict";

	/**
	 *  @class Maps a NormalRange [0, 1] to an AudioRange [-1, 1].
	 *         See also AudioToGain.
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @example
	 * var g2a = new GainToAudio();
	 */
	export var GainToAudio = function(){

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._norm = this.input = this.output = new WaveShaper(function(x){
			return Math.abs(x) * 2 - 1;
		});
	};

	Tone.extend(GainToAudio, SignalBase);

	/**
	 *  clean up
	 *  @returns {GainToAudio} this
	 */
	GainToAudio.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._norm.dispose();
		this._norm = null;
		return this;
	};
