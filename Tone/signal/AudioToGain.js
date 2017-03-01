import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';

import { Signal } from 'signal/Signal';


	"use strict";

	/**
	 *  @class AudioToGain converts an input in AudioRange [-1,1] to NormalRange [0,1].
	 *         See GainToAudio.
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @example
	 *  var a2g = new AudioToGain();
	 */
	export var AudioToGain = function(){

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._norm = this.input = this.output = new WaveShaper(function(x){
			return (x + 1) / 2;
		});
	};

	Tone.extend(AudioToGain, SignalBase);

	/**
	 *  clean up
	 *  @returns {AudioToGain} this
	 */
	AudioToGain.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._norm.dispose();
		this._norm = null;
		return this;
	};
