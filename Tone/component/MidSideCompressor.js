import { Tone } from 'core';
import { MidSideSplit } from 'component';
import { MidSideMerge } from 'component';
import { Compressor } from 'component';

	"use strict";

	/**
	 *  @class MidSideCompressor applies two different compressors to the mid
	 *         and side signal components. See MidSideSplit.
	 *
	 *  @extends {Tone}
	 *  @param {Object} options The options that are passed to the mid and side
	 *                          compressors.
	 *  @constructor
	 */
	export function MidSideCompressor(options){

		options = this.defaultArg(options, MidSideCompressor.defaults);

		/**
		 *  the mid/side split
		 *  @type  {MidSideSplit}
		 *  @private
		 */
		this._midSideSplit = this.input = new MidSideSplit();

		/**
		 *  the mid/side recombination
		 *  @type  {MidSideMerge}
		 *  @private
		 */
		this._midSideMerge = this.output = new MidSideMerge();

		/**
		 *  The compressor applied to the mid signal
		 *  @type  {Compressor}
		 */
		this.mid = new Compressor(options.mid);

		/**
		 *  The compressor applied to the side signal
		 *  @type  {Compressor}
		 */
		this.side = new Compressor(options.side);

		this._midSideSplit.mid.chain(this.mid, this._midSideMerge.mid);
		this._midSideSplit.side.chain(this.side, this._midSideMerge.side);
		this._readOnly(["mid", "side"]);
	};

	Tone.extend(MidSideCompressor);

	/**
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	MidSideCompressor.defaults = {
		"mid" : {
			"ratio" : 3,
			"threshold" : -24,
			"release" : 0.03,
			"attack" : 0.02,
			"knee" : 16
		},
		"side" : {
			"ratio" : 6,
			"threshold" : -30,
			"release" : 0.25,
			"attack" : 0.03,
			"knee" : 10
		}
	};

	/**
	 *  Clean up.
	 *  @returns {MidSideCompressor} this
	 */
	MidSideCompressor.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._writable(["mid", "side"]);
		this.mid.dispose();
		this.mid = null;
		this.side.dispose();
		this.side = null;
		this._midSideSplit.dispose();
		this._midSideSplit = null;
		this._midSideMerge.dispose();
		this._midSideMerge = null;
		return this;
	};
