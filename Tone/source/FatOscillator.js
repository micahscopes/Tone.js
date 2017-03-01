import { Tone } from 'core/Tone';

import { Source } from 'source/Source';

import { Oscillator } from 'source/Oscillator';

import { Multiply } from 'signal/Multiply';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class FatOscillator
	 *
	 *  @extends {Oscillator}
	 *  @constructor
	 *  @param {Frequency} frequency The starting frequency of the oscillator.
	 *  @param {String} type The type of the carrier oscillator.
	 *  @param {String} modulationType The type of the modulator oscillator.
	 *  @example
	 * //a sine oscillator frequency-modulated by a square wave
	 * var fmOsc = new FatOscillator("Ab3", "sine", "square").toMaster().start();
	 */
	export var FatOscillator = function(){

		var options = this.optionsObject(arguments, ["frequency", "type", "spread"], FatOscillator.defaults);
		Source.call(this, options);

		/**
		 *  The oscillator's frequency
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The detune control signal.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = new Signal(options.detune, Type.Cents);

		/**
		 *  The array of oscillators
		 *  @type {Array}
		 *  @private
		 */
		this._oscillators = [];

		/**
		 *  The total spread of the oscillators
		 *  @type  {Cents}
		 *  @private
		 */
		this._spread = options.spread;

		/**
		 *  The type of the oscillator
		 *  @type {String}
		 *  @private
		 */
		this._type = options.type;

		/**
		 *  The phase of the oscillators
		 *  @type {Degrees}
		 *  @private
		 */
		this._phase = options.phase;

		/**
		 *  The partials array
		 *  @type {Array}
		 *  @private
		 */
		this._partials = this.defaultArg(options.partials, []);

		//set the count initially
		this.count = options.count;

		this._readOnly(["frequency", "detune"]);
	};

	Tone.extend(FatOscillator, Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	FatOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"spread" : 20,
		"count" : 3,
		"type" : "sawtooth"
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now]
	 *  @private
	 */
	FatOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._forEach(function(osc){
			osc.start(time);
		});
	};

	/**
	 *  stop the oscillator
	 *  @param  {Time} time (optional) timing parameter
	 *  @private
	 */
	FatOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._forEach(function(osc){
			osc.stop(time);
		});
	};

	/**
	 *  Iterate over all of the oscillators
	 *  @param  {Function}  iterator  The iterator function
	 *  @private
	 */
	FatOscillator.prototype._forEach = function(iterator){
		for (var i = 0; i < this._oscillators.length; i++){
			iterator.call(this, this._oscillators[i], i);
		}
	};

	/**
	 * The type of the carrier oscillator
	 * @memberOf FatOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(FatOscillator.prototype, "type", {
		get : function(){
			return this._type;
		},
		set : function(type){
			this._type = type;
			this._forEach(function(osc){
				osc.type = type;
			});
		}
	});

	/**
	 * The detune spread between the oscillators. If "count" is
	 * set to 3 oscillators and the "spread" is set to 40,
	 * the three oscillators would be detuned like this: [-20, 0, 20]
	 * for a total detune spread of 40 cents.
	 * @memberOf FatOscillator#
	 * @type {Cents}
	 * @name spread
	 */
	Object.defineProperty(FatOscillator.prototype, "spread", {
		get : function(){
			return this._spread;
		},
		set : function(spread){
			this._spread = spread;
			if (this._oscillators.length > 1){
				var start = -spread/2;
				var step = spread / (this._oscillators.length - 1);
				this._forEach(function(osc, i){
					osc.detune.value = start + step * i;
				});
			}
		}
	});

	/**
	 * The number of detuned oscillators
	 * @memberOf FatOscillator#
	 * @type {Number}
	 * @name count
	 */
	Object.defineProperty(FatOscillator.prototype, "count", {
		get : function(){
			return this._oscillators.length;
		},
		set : function(count){
			count = Math.max(count, 1);
			if (this._oscillators.length !== count){
				// var partials = this.partials;
				// var type = this.type;
				//dispose the previous oscillators
				this._forEach(function(osc){
					osc.dispose();
				});
				this._oscillators = [];
				for (var i = 0; i < count; i++){
					var osc = new Oscillator();
					if (this.type === Oscillator.Type.Custom){
						osc.partials = this._partials;
					} else {
						osc.type = this._type;
					}
					osc.phase = this._phase;
					osc.volume.value = -6 - count;
					this.frequency.connect(osc.frequency);
					this.detune.connect(osc.detune);
					osc.connect(this.output);
					this._oscillators[i] = osc;
				}
				//set the spread
				this.spread = this._spread;
				if (this.state === State.Started){
					this._forEach(function(osc){
						osc.start();
					});
				}
			}
		}
	});

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf FatOscillator#
	 * @type {Number}
	 * @name phase
	 */
	Object.defineProperty(FatOscillator.prototype, "phase", {
		get : function(){
			return this._phase;
		},
		set : function(phase){
			this._phase = phase;
			this._forEach(function(osc){
				osc.phase = phase;
			});
		}
	});

	/**
	 * The partials of the carrier waveform. A partial represents
	 * the amplitude at a harmonic. The first harmonic is the
	 * fundamental frequency, the second is the octave and so on
	 * following the harmonic series.
	 * Setting this value will automatically set the type to "custom".
	 * The value is an empty array when the type is not "custom".
	 * @memberOf FatOscillator#
	 * @type {Array}
	 * @name partials
	 * @example
	 * osc.partials = [1, 0.2, 0.01];
	 */
	Object.defineProperty(FatOscillator.prototype, "partials", {
		get : function(){
			return this._partials;
		},
		set : function(partials){
			this._partials = partials;
			this._type = Oscillator.Type.Custom;
			this._forEach(function(osc){
				osc.partials = partials;
			});
		}
	});

	/**
	 *  Clean up.
	 *  @return {FatOscillator} this
	 */
	FatOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._writable(["frequency", "detune"]);
		this.frequency.dispose();
		this.frequency = null;
		this.detune.dispose();
		this.detune = null;
		this._forEach(function(osc){
			osc.dispose();
		});
		this._oscillators = null;
		this._partials = null;
		return this;
	};
