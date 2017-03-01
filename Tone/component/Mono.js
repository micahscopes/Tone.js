import { Tone } from 'core/Tone';

import { Merge } from 'component/Merge';


	"use strict";

	/**
	 *  @class Mono coerces the incoming mono or stereo signal into a mono signal
	 *         where both left and right channels have the same value. This can be useful
	 *         for [stereo imaging](https://en.wikipedia.org/wiki/Stereo_imaging).
	 *
	 *  @extends {Tone}
	 *  @constructor
	 */
	export var Mono = function(){
		this.createInsOuts(1, 0);

		/**
		 *  merge the signal
		 *  @type {Merge}
		 *  @private
		 */
		this._merge = this.output = new Merge();

		this.input.connect(this._merge, 0, 0);
		this.input.connect(this._merge, 0, 1);
		this.input.gain.value = this.dbToGain(-10);
	};

	Tone.extend(Mono);

	/**
	 *  clean up
	 *  @returns {Mono} this
	 */
	Mono.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._merge.dispose();
		this._merge = null;
		return this;
	};
