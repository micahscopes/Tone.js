import { Tone } from 'core';
import { Type } from 'type';

	"use strict";

	/**
	 *  @class CtrlInterpolate will interpolate between given values based
	 *         on the "index" property. Passing in an array or object literal
	 *         will interpolate each of the parameters. Note (i.e. "C3")
	 *         and Time (i.e. "4n + 2") can be interpolated. All other values are
	 *         assumed to be numbers.
	 *  @example
	 * var interp = new CtrlInterpolate([0, 2, 9, 4]);
	 * interp.index = 0.75;
	 * interp.value; //returns 1.5
	 *
	 *  @example
	 * var interp = new CtrlInterpolate([
	 * 	[2, 4, 5],
	 * 	[9, 3, 2],
	 * ]);
	 * @param {Array} values The array of values to interpolate over
	 * @param {Positive} index The initial interpolation index.
	 * @extends {Tone}
	 */
	export function CtrlInterpolate(){

		var options = this.optionsObject(arguments, ["values", "index"], CtrlInterpolate.defaults);

		/**
		 *  The values to interpolate between
		 *  @type  {Array}
		 */
		this.values = options.values;

		/**
		 *  The interpolated index between values. For example: a value of 1.5
		 *  would interpolate equally between the value at index 1
		 *  and the value at index 2.
		 *  @example
		 * interp.index = 0;
		 * interp.value; //returns the value at 0
		 * interp.index = 0.5;
		 * interp.value; //returns the value between indices 0 and 1.
		 *  @type  {Positive}
		 */
		this.index = options.index;
	};

	Tone.extend(CtrlInterpolate);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	CtrlInterpolate.defaults = {
		"index" : 0,
		"values" : []
	};

	/**
	 *  The current interpolated value based on the index
	 *  @readOnly
	 *  @memberOf CtrlInterpolate#
	 *  @type {*}
	 *  @name value
	 */
	Object.defineProperty(CtrlInterpolate.prototype, "value", {
		get : function(){
			var index = this.index;
			index = Math.min(index, this.values.length - 1);
			var lowerPosition = Math.floor(index);
			var lower = this.values[lowerPosition];
			var upper = this.values[Math.ceil(index)];
			return this._interpolate(index - lowerPosition, lower, upper);
		}
	});

	/**
	 *  Internal interpolation routine
	 *  @param  {NormalRange}  index  The index between the lower and upper
	 *  @param  {*}  lower
	 *  @param  {*}  upper
	 *  @return  {*}  The interpolated value
	 *  @private
	 */
	CtrlInterpolate.prototype._interpolate = function(index, lower, upper){
		if (this.isArray(lower)){
			var retArray = [];
			for (var i = 0; i < lower.length; i++){
				retArray[i] = this._interpolate(index, lower[i], upper[i]);
			}
			return retArray;
		} else if (this.isObject(lower)){
			var retObj = {};
			for (var attr in lower){
				retObj[attr] = this._interpolate(index, lower[attr], upper[attr]);
			}
			return retObj;
		} else {
			lower = this._toNumber(lower);
			upper = this._toNumber(upper);
			return (1 - index) * lower + index * upper;
		}
	};

	/**
	 *  Convert from the given type into a number
	 *  @param  {Number|String}  value
	 *  @return  {Number}
	 *  @private
	 */
	CtrlInterpolate.prototype._toNumber = function(val){
		if (this.isNumber(val)){
			return val;
		} else {
			//otherwise assume that it's Time...
			return this.toSeconds(val);
		}
	};

	/**
	 *  Clean up
	 *  @return  {CtrlInterpolate}  this
	 */
	CtrlInterpolate.prototype.dispose = function(){
		this.values = null;
	};
