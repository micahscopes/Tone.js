import { Tone } from 'core/Tone';

import { MidSideEffect } from 'effect/MidSideEffect';

import { Signal } from 'signal/Signal';

import { Multiply } from 'signal/Multiply';

import { Expr } from 'signal/Expr';


	"use strict";

	/**
	 *  @class Applies a width factor to the mid/side seperation.
	 *         0 is all mid and 1 is all side.
	 *         Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
	 *         <br><br>
	 *         <code>
	 *         Mid *= 2*(1-width)<br>
	 *         Side *= 2*width
	 *         </code>
	 *
	 *  @extends {MidSideEffect}
	 *  @constructor
	 *  @param {NormalRange|Object} [width] The stereo width. A width of 0 is mono and 1 is stereo. 0.5 is no change.
	 */
	export var StereoWidener = function(){

		var options = this.optionsObject(arguments, ["width"], StereoWidener.defaults);
		MidSideEffect.call(this, options);

		/**
		 *  The width control. 0 = 100% mid. 1 = 100% side. 0.5 = no change.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.width = new Signal(options.width, Type.NormalRange);

		/**
		 *  Mid multiplier
		 *  @type {Expr}
		 *  @private
		 */
		this._midMult = new Expr("$0 * ($1 * (1 - $2))");

		/**
		 *  Side multiplier
		 *  @type {Expr}
		 *  @private
		 */
		this._sideMult = new Expr("$0 * ($1 * $2)");

		/**
		 *  constant output of 2
		 *  @type {Tone}
		 *  @private
		 */
		this._two = new Signal(2);

		//the mid chain
		this._two.connect(this._midMult, 0, 1);
		this.width.connect(this._midMult, 0, 2);
		//the side chain
		this._two.connect(this._sideMult, 0, 1);
		this.width.connect(this._sideMult, 0, 2);
		//connect it to the effect send/return
		this.midSend.chain(this._midMult, this.midReturn);
		this.sideSend.chain(this._sideMult, this.sideReturn);
		this._readOnly(["width"]);
	};

	Tone.extend(StereoWidener, MidSideEffect);

	/**
	 *  the default values
	 *  @static
	 *  @type {Object}
	 */
	StereoWidener.defaults = {
		"width" : 0.5
	};

	/**
	 *  Clean up.
	 *  @returns {StereoWidener} this
	 */
	StereoWidener.prototype.dispose = function(){
		MidSideEffect.prototype.dispose.call(this);
		this._writable(["width"]);
		this.width.dispose();
		this.width = null;
		this._midMult.dispose();
		this._midMult = null;
		this._sideMult.dispose();
		this._sideMult = null;
		this._two.dispose();
		this._two = null;
		return this;
	};
