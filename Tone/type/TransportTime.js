import { Tone } from 'core/Tone';

import { Time } from 'type/Time';


	/**
	 *  @class TransportTime is a the time along the Transport's
	 *         timeline. It is similar to Time, but instead of evaluating
	 *         against the AudioContext's clock, it is evaluated against
	 *         the Transport's position. See [TransportTime wiki](https://github.com/Tonejs/js/wiki/TransportTime).
	 *  @constructor
	 *  @param  {Time}  val    The time value as a number or string
	 *  @param  {String=}  units  Unit values
	 *  @extends {Time}
	 */
	export var TransportTime = function(val, units){
		if (this instanceof TransportTime){

			Time.call(this, val, units);

		} else {
			return new TransportTime(val, units);
		}
	};

	Tone.extend(TransportTime, Time);

	//clone the expressions so that
	//we can add more without modifying the original
	TransportTime.prototype._unaryExpressions = Object.create(Time.prototype._unaryExpressions);

	/**
	 *  Adds an additional unary expression
	 *  which quantizes values to the next subdivision
	 *  @type {Object}
	 *  @private
	 */
	TransportTime.prototype._unaryExpressions.quantize = {
		regexp : /^@/,
		method : function(rh){
			var subdivision = this._secondsToTicks(rh());
			var multiple = Math.ceil(Transport.ticks / subdivision);
			return this._ticksToUnits(multiple * subdivision);
		}
	};

	/**
	 *  Convert seconds into ticks
	 *  @param {Seconds} seconds
	 *  @return  {Ticks}
	 *  @private
	 */
	TransportTime.prototype._secondsToTicks = function(seconds){
		var quarterTime = this._beatsToUnits(1);
		var quarters = seconds / quarterTime;
		return Math.round(quarters * Transport.PPQ);
	};

	/**
	 *  Evaluate the time expression. Returns values in ticks
	 *  @return {Ticks}
	 */
	TransportTime.prototype.eval = function(){
		var val = this._secondsToTicks(this._expr());
		return val + (this._plusNow ? Transport.ticks : 0);
	};

	/**
	 *  Return the time in ticks.
	 *  @return  {Ticks}
	 */
	TransportTime.prototype.toTicks = function(){
		return this.eval();
	};

	/**
	 *  Return the time in seconds.
	 *  @return  {Seconds}
	 */
	TransportTime.prototype.toSeconds = function(){
		var val = this._expr();
		return val + (this._plusNow ? Transport.seconds : 0);
	};

	/**
	 *  Return the time as a frequency value
	 *  @return  {Frequency}
	 */
	TransportTime.prototype.toFrequency = function(){
		return 1/this.toSeconds();
	};
