import { Tone } from 'core/Tone';

import { Param } from 'core/Param';

import { Type } from 'type/Type';


	"use strict";

	/**
	 *  @class A thin wrapper around the Native Web Audio GainNode.
	 *         The GainNode is a basic building block of the Web Audio
	 *         API and is useful for routing audio and adjusting gains.
	 *  @extends {Tone}
	 *  @param  {Number=}  gain  The initial gain of the GainNode
	 *  @param {Type=} units The units of the gain parameter.
	 */
	export var Gain = function(){

		var options = this.optionsObject(arguments, ["gain", "units"], Gain.defaults);

		/**
		 *  The GainNode
		 *  @type  {GainNode}
		 *  @private
		 */
		this.input = this.output = this._gainNode = this.context.createGain();

		/**
		 *  The gain parameter of the gain node.
		 *  @type {Param}
		 *  @signal
		 */
		this.gain = new Param({
			"param" : this._gainNode.gain,
			"units" : options.units,
			"value" : options.gain,
			"convert" : options.convert
		});
		this._readOnly("gain");
	};

	Tone.extend(Gain);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Gain.defaults = {
		"gain" : 1,
		"convert" : true,
	};

	/**
	 *  Clean up.
	 *  @return  {Gain}  this
	 */
	Gain.prototype.dispose = function(){
		Param.prototype.dispose.call(this);
		this._gainNode.disconnect();
		this._gainNode = null;
		this._writable("gain");
		this.gain.dispose();
		this.gain = null;
	};

	//STATIC///////////////////////////////////////////////////////////////////

	/**
	 *  Create input and outputs for this object.
	 *  @param  {Number}  input   The number of inputs
	 *  @param  {Number=}  outputs  The number of outputs
	 *  @return  {Tone}  this
	 *  @internal
	 */
	prototype.createInsOuts = function(inputs, outputs){

		if (inputs === 1){
			this.input = new Gain();
		} else if (inputs > 1){
			this.input = new Array(inputs);
		}

		if (outputs === 1){
			this.output = new Gain();
		} else if (outputs > 1){
			this.output = new Array(inputs);
		}
	};

	///////////////////////////////////////////////////////////////////////////
