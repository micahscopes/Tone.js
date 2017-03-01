import { Tone } from 'core/Tone';

import { Param } from 'core/Param';


	"use strict";

	/**
	 *  @class Wrapper around Web Audio's native [DelayNode](http://webaudio.github.io/web-audio-api/#the-delaynode-interface).
	 *  @extends {Tone}
	 *  @param {Time=} delayTime The delay applied to the incoming signal.
	 *  @param {Time=} maxDelay The maximum delay time.
	 */
	export var Delay = function(){

		var options = this.optionsObject(arguments, ["delayTime", "maxDelay"], Delay.defaults);

		/**
		 *  The native delay node
		 *  @type {DelayNode}
		 *  @private
		 */
		this._delayNode = this.input = this.output = this.context.createDelay(this.toSeconds(options.maxDelay));

		/**
		 *  The amount of time the incoming signal is
		 *  delayed.
		 *  @type {Param}
		 *  @signal
		 */
		this.delayTime = new Param({
			"param" : this._delayNode.delayTime,
			"units" : Type.Time,
			"value" : options.delayTime
		});

		this._readOnly("delayTime");
	};

	Tone.extend(Delay);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Delay.defaults = {
		"maxDelay" : 1,
		"delayTime" : 0
	};

	/**
	 *  Clean up.
	 *  @return  {Delay}  this
	 */
	Delay.prototype.dispose = function(){
		Param.prototype.dispose.call(this);
		this._delayNode.disconnect();
		this._delayNode = null;
		this._writable("delayTime");
		this.delayTime = null;
		return this;
	};
