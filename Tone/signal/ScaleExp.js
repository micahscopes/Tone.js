import { Tone } from 'core/Tone';

import { Scale } from 'signal/Scale';

import { Pow } from 'signal/Pow';


	/**
	 *  @class  Performs an exponential scaling on an input signal.
	 *          Scales a NormalRange value [0,1] exponentially
	 *          to the output range of outputMin to outputMax.
	 *
	 *  @constructor
	 *  @extends {SignalBase}
	 *  @param {number} [outputMin=0] The output value when the input is 0.
	 *  @param {number} [outputMax=1]	The output value when the input is 1.
	 *  @param {number} [exponent=2] The exponent which scales the incoming signal.
	 *  @example
	 * var scaleExp = new ScaleExp(0, 100, 2);
	 * var signal = new Signal(0.5).connect(scaleExp);
	 */
	export var ScaleExp = function(outputMin, outputMax, exponent){

		/**
		 *  scale the input to the output range
		 *  @type {Scale}
		 *  @private
		 */
		this._scale = this.output = new Scale(outputMin, outputMax);

		/**
		 *  @private
		 *  @type {Pow}
		 *  @private
		 */
		this._exp = this.input = new Pow(this.defaultArg(exponent, 2));

		this._exp.connect(this._scale);
	};

	Tone.extend(ScaleExp, SignalBase);

	/**
	 * Instead of interpolating linearly between the <code>min</code> and
	 * <code>max</code> values, setting the exponent will interpolate between
	 * the two values with an exponential curve.
	 * @memberOf ScaleExp#
	 * @type {number}
	 * @name exponent
	 */
	Object.defineProperty(ScaleExp.prototype, "exponent", {
		get : function(){
			return this._exp.value;
		},
		set : function(exp){
			this._exp.value = exp;
		}
	});

	/**
	 * The minimum output value. This number is output when
	 * the value input value is 0.
	 * @memberOf ScaleExp#
	 * @type {number}
	 * @name min
	 */
	Object.defineProperty(ScaleExp.prototype, "min", {
		get : function(){
			return this._scale.min;
		},
		set : function(min){
			this._scale.min = min;
		}
	});

	/**
	 * The maximum output value. This number is output when
	 * the value input value is 1.
	 * @memberOf ScaleExp#
	 * @type {number}
	 * @name max
	 */
	Object.defineProperty(ScaleExp.prototype, "max", {
		get : function(){
			return this._scale.max;
		},
		set : function(max){
			this._scale.max = max;
		}
	});

	/**
	 *  Clean up.
	 *  @returns {ScaleExp} this
	 */
	ScaleExp.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._scale.dispose();
		this._scale = null;
		this._exp.dispose();
		this._exp = null;
		return this;
	};
