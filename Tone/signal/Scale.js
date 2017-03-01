import { Tone } from 'core/Tone';

import { Add } from 'signal/Add';

import { Multiply } from 'signal/Multiply';

import { Signal } from 'signal/Signal';


	"use strict";

	/**
	 *  @class  Performs a linear scaling on an input signal.
	 *          Scales a NormalRange input to between
	 *          outputMin and outputMax.
	 *
	 *  @constructor
	 *  @extends {SignalBase}
	 *  @param {number} [outputMin=0] The output value when the input is 0.
	 *  @param {number} [outputMax=1]	The output value when the input is 1.
	 *  @example
	 * var scale = new Scale(50, 100);
	 * var signal = new Signal(0.5).connect(scale);
	 * //the output of scale equals 75
	 */
	export var Scale = function(outputMin, outputMax){

		/**
		 *  @private
		 *  @type {number}
		 */
		this._outputMin = this.defaultArg(outputMin, 0);

		/**
		 *  @private
		 *  @type {number}
		 */
		this._outputMax = this.defaultArg(outputMax, 1);


		/**
		 *  @private
		 *  @type {Multiply}
		 *  @private
		 */
		this._scale = this.input = new Multiply(1);

		/**
		 *  @private
		 *  @type {Add}
		 *  @private
		 */
		this._add = this.output = new Add(0);

		this._scale.connect(this._add);
		this._setRange();
	};

	Tone.extend(Scale, SignalBase);

	/**
	 * The minimum output value. This number is output when
	 * the value input value is 0.
	 * @memberOf Scale#
	 * @type {number}
	 * @name min
	 */
	Object.defineProperty(Scale.prototype, "min", {
		get : function(){
			return this._outputMin;
		},
		set : function(min){
			this._outputMin = min;
			this._setRange();
		}
	});

	/**
	 * The maximum output value. This number is output when
	 * the value input value is 1.
	 * @memberOf Scale#
	 * @type {number}
	 * @name max
	 */
	Object.defineProperty(Scale.prototype, "max", {
		get : function(){
			return this._outputMax;
		},
		set : function(max){
			this._outputMax = max;
			this._setRange();
		}
	});

	/**
	 *  set the values
	 *  @private
	 */
	Scale.prototype._setRange = function() {
		this._add.value = this._outputMin;
		this._scale.value = this._outputMax - this._outputMin;
	};

	/**
	 *  Clean up.
	 *  @returns {Scale} this
	 */
	Scale.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._add.dispose();
		this._add = null;
		this._scale.dispose();
		this._scale = null;
		return this;
	};
