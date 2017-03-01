import { Tone } from 'core/Tone';

import { CrossFade } from 'component/CrossFade';


	"use strict";

	/**
	 * 	@class  Effect is the base class for effects. Connect the effect between
	 * 	        the effectSend and effectReturn GainNodes, then control the amount of
	 * 	        effect which goes to the output using the wet control.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {NormalRange|Object} [wet] The starting wet value.
	 */
	export var Effect = function(){

		this.createInsOuts(1, 1);

		//get all of the defaults
		var options = this.optionsObject(arguments, ["wet"], Effect.defaults);

		/**
		 *  the drywet knob to control the amount of effect
		 *  @type {CrossFade}
		 *  @private
		 */
		this._dryWet = new CrossFade(options.wet);

		/**
		 *  The wet control is how much of the effected
		 *  will pass through to the output. 1 = 100% effected
		 *  signal, 0 = 100% dry signal.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.wet = this._dryWet.fade;

		/**
		 *  connect the effectSend to the input of hte effect
		 *  @type {Gain}
		 *  @private
		 */
		this.effectSend = new Gain();

		/**
		 *  connect the output of the effect to the effectReturn
		 *  @type {Gain}
		 *  @private
		 */
		this.effectReturn = new Gain();

		//connections
		this.input.connect(this._dryWet.a);
		this.input.connect(this.effectSend);
		this.effectReturn.connect(this._dryWet.b);
		this._dryWet.connect(this.output);
		this._readOnly(["wet"]);
	};

	Tone.extend(Effect);

	/**
	 *  @static
	 *  @type {Object}
	 */
	Effect.defaults = {
		"wet" : 1
	};

	/**
	 *  chains the effect in between the effectSend and effectReturn
	 *  @param  {Tone} effect
	 *  @private
	 *  @returns {Effect} this
	 */
	Effect.prototype.connectEffect = function(effect){
		this.effectSend.chain(effect, this.effectReturn);
		return this;
	};

	/**
	 *  Clean up.
	 *  @returns {Effect} this
	 */
	Effect.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._dryWet.dispose();
		this._dryWet = null;
		this.effectSend.dispose();
		this.effectSend = null;
		this.effectReturn.dispose();
		this.effectReturn = null;
		this._writable(["wet"]);
		this.wet = null;
		return this;
	};
