import { Tone } from 'core';
import { WaveShaper } from 'signal';
import { Type } from 'type';
import { Param } from 'core';
import { Gain } from 'core';

	"use strict";

	/**
	 *  @class  A signal is an audio-rate value. Signal is a core component of the library.
	 *          Unlike a number, Signals can be scheduled with sample-level accuracy. Signal
	 *          has all of the methods available to native Web Audio
	 *          [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)
	 *          as well as additional conveniences. Read more about working with signals
	 *          [here](https://github.com/Tonejs/js/wiki/Signals).
	 *
	 *  @constructor
	 *  @extends {Param}
	 *  @param {Number|AudioParam} [value] Initial value of the signal. If an AudioParam
	 *                                     is passed in, that parameter will be wrapped
	 *                                     and controlled by the Signal.
	 *  @param {string} [units=Number] unit The units the signal is in.
	 *  @example
	 * var signal = new Signal(10);
	 */
	export function Signal(){

		var options = this.optionsObject(arguments, ["value", "units"], Signal.defaults);

		/**
		 * The node where the constant signal value is scaled.
		 * @type {GainNode}
		 * @private
		 */
		this.output = this._gain = this.context.createGain();

		options.param = this._gain.gain;
		Param.call(this, options);

		/**
		 * The node where the value is set.
		 * @type {Param}
		 * @private
		 */
		this.input = this._param = this._gain.gain;

		//connect the const output to the node output
		this.context._ones.chain(this._gain);
	};

	Tone.extend(Signal, Param);

	/**
	 *  The default values
	 *  @type  {Object}
	 *  @static
	 *  @const
	 */
	Signal.defaults = {
		"value" : 0,
		"units" : Type.Default,
		"convert" : true,
	};

	/**
	 *  When signals connect to other signals or AudioParams,
	 *  they take over the output value of that signal or AudioParam.
	 *  For all other nodes, the behavior is the same as a default <code>connect</code>.
	 *
	 *  @override
	 *  @param {AudioParam|AudioNode|Signal|Tone} node
	 *  @param {number} [outputNumber=0] The output number to connect from.
	 *  @param {number} [inputNumber=0] The input number to connect to.
	 *  @returns {SignalBase} this
	 *  @method
	 */
	Signal.prototype.connect = SignalBase.prototype.connect;

	/**
	 *  dispose and disconnect
	 *  @returns {Signal} this
	 */
	Signal.prototype.dispose = function(){
		Param.prototype.dispose.call(this);
		this._param = null;
		this._gain.disconnect();
		this._gain = null;
		return this;
	};
