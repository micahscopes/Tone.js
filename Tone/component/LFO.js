import { Tone } from 'core/Tone';

import { Oscillator } from 'source/Oscillator';

import { Scale } from 'signal/Scale';

import { Signal } from 'signal/Signal';

import { AudioToGain } from 'signal/AudioToGain';

import { Type } from 'type/Type';

import { Zero } from 'signal/Zero';


	"use strict";

	/**
	 *  @class  LFO stands for low frequency oscillator. LFO produces an output signal
	 *          which can be attached to an AudioParam or Signal
	 *          in order to modulate that parameter with an oscillator. The LFO can
	 *          also be synced to the transport to start/stop and change when the tempo changes.
	 *
	 *  @constructor
	 *  @extends {Oscillator}
	 *  @param {Frequency|Object} [frequency] The frequency of the oscillation. Typically, LFOs will be
	 *                               in the frequency range of 0.1 to 10 hertz.
	 *  @param {number=} min The minimum output value of the LFO.
	 *  @param {number=} max The maximum value of the LFO.
	 *  @example
	 * var lfo = new LFO("4n", 400, 4000);
	 * lfo.connect(filter.frequency);
	 */
	export var LFO = function(){

		var options = this.optionsObject(arguments, ["frequency", "min", "max"], LFO.defaults);

		/**
		 *  The oscillator.
		 *  @type {Oscillator}
		 *  @private
		 */
		this._oscillator = new Oscillator({
			"frequency" : options.frequency,
			"type" : options.type,
		});

		/**
		 *  the lfo's frequency
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = this._oscillator.frequency;

		/**
		 * The amplitude of the LFO, which controls the output range between
		 * the min and max output. For example if the min is -10 and the max
		 * is 10, setting the amplitude to 0.5 would make the LFO modulate
		 * between -5 and 5.
		 * @type {Number}
		 * @signal
		 */
		this.amplitude = this._oscillator.volume;
		this.amplitude.units = Type.NormalRange;
		this.amplitude.value = options.amplitude;

		/**
		 *  The signal which is output when the LFO is stopped
		 *  @type  {Signal}
		 *  @private
		 */
		this._stoppedSignal = new Signal(0, Type.AudioRange);

		/**
		 *  Just outputs zeros.
		 *  @type {Zero}
		 *  @private
		 */
		this._zeros = new Zero();

		/**
		 *  The value that the LFO outputs when it's stopped
		 *  @type {AudioRange}
		 *  @private
		 */
		this._stoppedValue = 0;

		/**
		 *  @type {AudioToGain}
		 *  @private
		 */
		this._a2g = new AudioToGain();

		/**
		 *  @type {Scale}
		 *  @private
		 */
		this._scaler = this.output = new Scale(options.min, options.max);

		/**
		 *  the units of the LFO (used for converting)
		 *  @type {Type}
		 *  @private
		 */
		this._units = Type.Default;
		this.units = options.units;

		//connect it up
		this._oscillator.chain(this._a2g, this._scaler);
		this._zeros.connect(this._a2g);
		this._stoppedSignal.connect(this._a2g);
		this._readOnly(["amplitude", "frequency"]);
		this.phase = options.phase;
	};

	Tone.extend(LFO, Oscillator);

	/**
	 *  the default parameters
	 *
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	LFO.defaults = {
		"type" : "sine",
		"min" : 0,
		"max" : 1,
		"phase" : 0,
		"frequency" : "4n",
		"amplitude" : 1,
		"units" : Type.Default
	};

	/**
	 *  Start the LFO.
	 *  @param  {Time} [time=now] the time the LFO will start
	 *  @returns {LFO} this
	 */
	LFO.prototype.start = function(time){
		time = this.toSeconds(time);
		this._stoppedSignal.setValueAtTime(0, time);
		this._oscillator.start(time);
		return this;
	};

	/**
	 *  Stop the LFO.
	 *  @param  {Time} [time=now] the time the LFO will stop
	 *  @returns {LFO} this
	 */
	LFO.prototype.stop = function(time){
		time = this.toSeconds(time);
		this._stoppedSignal.setValueAtTime(this._stoppedValue, time);
		this._oscillator.stop(time);
		return this;
	};

	/**
	 *  Sync the start/stop/pause to the transport
	 *  and the frequency to the bpm of the transport
	 *  @returns {LFO} this
	 *  @example
	 *  lfo.frequency.value = "8n";
	 *  lfo.sync().start(0)
	 *  //the rate of the LFO will always be an eighth note,
	 *  //even as the tempo changes
	 */
	LFO.prototype.sync = function(){
		this._oscillator.sync();
		this._oscillator.syncFrequency();
		return this;
	};

	/**
	 *  unsync the LFO from transport control
	 *  @returns {LFO} this
	 */
	LFO.prototype.unsync = function(){
		this._oscillator.unsync();
		this._oscillator.unsyncFrequency();
		return this;
	};

	/**
	 * The miniumum output of the LFO.
	 * @memberOf LFO#
	 * @type {number}
	 * @name min
	 */
	Object.defineProperty(LFO.prototype, "min", {
		get : function(){
			return this._toUnits(this._scaler.min);
		},
		set : function(min){
			min = this._fromUnits(min);
			this._scaler.min = min;
		}
	});

	/**
	 * The maximum output of the LFO.
	 * @memberOf LFO#
	 * @type {number}
	 * @name max
	 */
	Object.defineProperty(LFO.prototype, "max", {
		get : function(){
			return this._toUnits(this._scaler.max);
		},
		set : function(max){
			max = this._fromUnits(max);
			this._scaler.max = max;
		}
	});

	/**
	 * The type of the oscillator: sine, square, sawtooth, triangle.
	 * @memberOf LFO#
	 * @type {string}
	 * @name type
	 */
	 Object.defineProperty(LFO.prototype, "type", {
		get : function(){
			return this._oscillator.type;
		},
		set : function(type){
			this._oscillator.type = type;
			this._stoppedValue = this._oscillator._getInitialValue();
			this._stoppedSignal.value = this._stoppedValue;
		}
	});

	/**
	 * The phase of the LFO.
	 * @memberOf LFO#
	 * @type {number}
	 * @name phase
	 */
	 Object.defineProperty(LFO.prototype, "phase", {
		get : function(){
			return this._oscillator.phase;
		},
		set : function(phase){
			this._oscillator.phase = phase;
			this._stoppedValue = this._oscillator._getInitialValue();
			this._stoppedSignal.value = this._stoppedValue;
		}
	});

	/**
	 * The output units of the LFO.
	 * @memberOf LFO#
	 * @type {Type}
	 * @name units
	 */
	 Object.defineProperty(LFO.prototype, "units", {
		get : function(){
			return this._units;
		},
		set : function(val){
			var currentMin = this.min;
			var currentMax = this.max;
			//convert the min and the max
			this._units = val;
			this.min = currentMin;
			this.max = currentMax;
		}
	});

	/**
	 * Mute the output.
	 * @memberOf LFO#
	 * @type {Boolean}
	 * @name mute
	 */
	Object.defineProperty(LFO.prototype, "mute", {
		get : function(){
			return this._oscillator.mute;
		},
		set : function(mute){
			this._oscillator.mute = mute;
		}
	});

	/**
	 *  Returns the playback state of the source, either "started" or "stopped".
	 *  @type {State}
	 *  @readOnly
	 *  @memberOf LFO#
	 *  @name state
	 */
	Object.defineProperty(LFO.prototype, "state", {
		get : function(){
			return this._oscillator.state;
		}
	});

	/**
	 *  Connect the output of the LFO to an AudioParam, AudioNode, or Tone Node.
	 *  LFO will automatically convert to the destination units of the
	 *  will get the units from the connected node.
	 *  @param  {Tone | AudioParam | AudioNode} node
	 *  @param {number} [outputNum=0] optionally which output to connect from
	 *  @param {number} [inputNum=0] optionally which input to connect to
	 *  @returns {LFO} this
	 *  @private
	 */
	LFO.prototype.connect = function(node){
		if (node.constructor === Signal || node.constructor === Param || node.constructor === TimelineSignal){
			this.convert = node.convert;
			this.units = node.units;
		}
		Signal.prototype.connect.apply(this, arguments);
		return this;
	};

	/**
	 *  private method borrowed from Param converts
	 *  units from their destination value
	 *  @function
	 *  @private
	 */
	LFO.prototype._fromUnits = Param.prototype._fromUnits;

	/**
	 *  private method borrowed from Param converts
	 *  units to their destination value
	 *  @function
	 *  @private
	 */
	LFO.prototype._toUnits = Param.prototype._toUnits;

	/**
	 *  disconnect and dispose
	 *  @returns {LFO} this
	 */
	LFO.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable(["amplitude", "frequency"]);
		this._oscillator.dispose();
		this._oscillator = null;
		this._stoppedSignal.dispose();
		this._stoppedSignal = null;
		this._zeros.dispose();
		this._zeros = null;
		this._scaler.dispose();
		this._scaler = null;
		this._a2g.dispose();
		this._a2g = null;
		this.frequency = null;
		this.amplitude = null;
		return this;
	};
