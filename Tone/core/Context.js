import { Tone } from 'core';
import { Emitter } from 'core';

	/**
	 *  @class Wrapper around the native AudioContext.
	 *  @extends {Emitter}
	 *  @param {AudioContext=} context optionally pass in a context
	 */
	export function Context(context){

		Emitter.call(this);

		if (!context){
			context = new window.AudioContext();
		}
		this._context = context;
		// extend all of the methods
		for (var prop in this._context){
			this._defineProperty(this._context, prop);
		}

		///////////////////////////////////////////////////////////////////////
		// WORKER
		///////////////////////////////////////////////////////////////////////

		/**
		 *  The default latency hint
		 *  @type  {String}
		 *  @private
		 */
		this._latencyHint = "interactive";

		/**
		 *  The amount of time events are scheduled
		 *  into the future
		 *  @type  {Number}
		 *  @private
		 */
		this._lookAhead = 0.1;

		/**
		 *  How often the update look runs
		 *  @type  {Number}
		 *  @private
		 */
		this._updateInterval = this._lookAhead/3;

		/**
		 *  A reference to the actual computed update
		 *  interval
		 *  @type  {Number}
		 *  @private
		 */
		this._computedUpdateInterval = 0;

		/**
		 *  The web worker which is used to update
		 *  Clock
		 *  @private
		 *  @type  {WebWorker}
		 */
		this._worker = this._createWorker();

		///////////////////////////////////////////////////////////////////////
		// CONSTANTS
		///////////////////////////////////////////////////////////////////////

		/**
		 *  Outputs a constant value of 1
		 *  @type  {AudioBufferSourceNode}
		 *  @private
		 */
		this._ones = this._createConstant(1);

		/**
		 *  Outputs a constant value of 0
		 *  @type  {AudioBufferSourceNode}
		 *  @private
		 */
		this._zeros = this._createConstant(0);

		/**
		 *  Outputs a constant value of 1/sqrt(2)
		 *  @type  {AudioBufferSourceNode}
		 *  @private
		 */
		this._sqrtTwo = this._createConstant(1 / Math.sqrt(2));
	};

	Tone.extend(Context, Emitter);
	Emitter.mixin(Context);

	/**
	 *  Define a property on this Context.
	 *  This is used to extend the native AudioContext
	 *  @param  {AudioContext}  context
	 *  @param  {String}  prop
	 *  @private
	 */
	Context.prototype._defineProperty = function(context, prop){
		if (this.isUndef(this[prop])){
			Object.defineProperty(this, prop, {
				get : function(){
					if (typeof context[prop] === "function"){
						return context[prop].bind(context);
					} else {
						return context[prop];
					}
				},
				set : function(val){
					context[prop] = val;
				}
			});
		}
	};

	/**
	 *  The current audio context time
	 *  @return  {Number}
	 */
	Context.prototype.now = function(){
		return this._context.currentTime;
	};

	/**
	 *  Generate a web worker
	 *  @return  {WebWorker}
	 *  @private
	 */
	Context.prototype._createWorker = function(){

		//URL Shim
		window.URL = window.URL || window.webkitURL;

		var blob = new Blob([
			//the initial timeout time
			"var timeoutTime = "+(this._updateInterval * 1000).toFixed(1)+";" +
			//onmessage callback
			"self.onmessage = function(msg){" +
			"	timeoutTime = parseInt(msg.data);" +
			"};" +
			//the tick function which posts a message
			//and schedules a new tick
			"function tick(){" +
			"	setTimeout(tick, timeoutTime);" +
			"	self.postMessage('tick');" +
			"}" +
			//call tick initially
			"tick();"
		]);
		var blobUrl = URL.createObjectURL(blob);
		var worker = new Worker(blobUrl);

		worker.addEventListener("message", function(){
			// tick the clock
			this.emit("tick");
		}.bind(this));

		//lag compensation
		worker.addEventListener("message", function(){
			var now = this.now();
			if (this.isNumber(this._lastUpdate)){
				var diff = now - this._lastUpdate;
				this._computedUpdateInterval = Math.max(diff, this._computedUpdateInterval * 0.97);
			}
			this._lastUpdate = now;
		}.bind(this));

		return worker;
	};

	/**
	 *  Generate a looped buffer at some constant
	 *  @param  {Number}  val
	 *  @return  {BufferSourceNode}
	 *  @private
	 */
	Context.prototype._createConstant = function(val){
		var buffer = this._context.createBuffer(1, 128, this._context.sampleRate);
		var arr = buffer.getChannelData(0);
		for (var i = 0; i < arr.length; i++){
			arr[i] = val;
		}
		var constant = this._context.createBufferSource();
		constant.channelCount = 1;
		constant.channelCountMode = "explicit";
		constant.buffer = buffer;
		constant.loop = true;
		constant.start(0);
		return constant;
	};

	/**
	 *  This is the time that the clock is falling behind
	 *  the scheduled update interval. The Context automatically
	 *  adjusts for the lag and schedules further in advance.
	 *  @type {Number}
	 *  @memberOf Context
	 *  @name lag
	 *  @static
	 *  @readOnly
	 */
	Object.defineProperty(Context.prototype, "lag", {
		get : function(){
			var diff = this._computedUpdateInterval - this._updateInterval;
			diff = Math.max(diff, 0);
			return diff;
		}
	});

	/**
	 *  The amount of time in advance that events are scheduled.
	 *  The lookAhead will adjust slightly in response to the
	 *  measured update time to try to avoid clicks.
	 *  @type {Number}
	 *  @memberOf Context
	 *  @name lookAhead
	 *  @static
	 */
	Object.defineProperty(Context.prototype, "lookAhead", {
		get : function(){
			return this._lookAhead;
		},
		set : function(lA){
			this._lookAhead = lA;
		}
	});

	/**
	 *  How often the Web Worker callback is invoked.
	 *  This number corresponds to how responsive the scheduling
	 *  can be. Context.updateInterval + Context.lookAhead gives you the
	 *  total latency between scheduling an event and hearing it.
	 *  @type {Number}
	 *  @memberOf Context
	 *  @name updateInterval
	 *  @static
	 */
	Object.defineProperty(Context.prototype, "updateInterval", {
		get : function(){
			return this._updateInterval;
		},
		set : function(interval){
			this._updateInterval = Math.max(interval, prototype.blockTime);
			this._worker.postMessage(Math.max(interval * 1000, 1));
		}
	});

	/**
	 *  The type of playback, which affects tradeoffs between audio
	 *  output latency and responsiveness.
	 *
	 *  In addition to setting the value in seconds, the latencyHint also
	 *  accepts the strings "interactive" (prioritizes low latency),
	 *  "playback" (prioritizes sustained playback), "balanced" (balances
	 *  latency and performance), and "fastest" (lowest latency, might glitch more often).
	 *  @type {String|Seconds}
	 *  @memberOf Context#
	 *  @name latencyHint
	 *  @static
	 *  @example
	 * //set the lookAhead to 0.3 seconds
	 * context.latencyHint = 0.3;
	 */
	Object.defineProperty(Context.prototype, "latencyHint", {
		get : function(){
			return this._latencyHint;
		},
		set : function(hint){
			var lookAhead = hint;
			this._latencyHint = hint;
			if (this.isString(hint)){
				switch(hint){
					case "interactive" :
						lookAhead = 0.1;
						this._context.latencyHint = hint;
						break;
					case "playback" :
						lookAhead = 0.8;
						this._context.latencyHint = hint;
						break;
					case "balanced" :
						lookAhead = 0.25;
						this._context.latencyHint = hint;
						break;
					case "fastest" :
						lookAhead = 0.01;
						break;
				}
			}
			this.lookAhead = lookAhead;
			this.updateInterval = lookAhead/3;
		}
	});

	/**
	 *  Shim all connect/disconnect and some deprecated methods which are still in
	 *  some older implementations.
	 *  @private
	 */
	function shimAudioContext(){

		//shim the main audio context constructors
		if (window.hasOwnProperty("webkitAudioContext") && !window.hasOwnProperty("AudioContext")){
			window.AudioContext = window.webkitAudioContext;
		}

		if (window.hasOwnProperty("webkitOfflineAudioContext") && !window.hasOwnProperty("OfflineAudioContext")){
			window.OfflineAudioContext = window.webkitOfflineAudioContext;
		}

		var isUndef = prototype.isUndef;
		var isFunction = prototype.isFunction;

		var nativeConnect = AudioNode.prototype.connect;
		//replace the old connect method
		AudioNode.prototype.connect = function toneConnect(B, outNum, inNum){
			if (B.input){
				if (Array.isArray(B.input)){
					if (isUndef(inNum)){
						inNum = 0;
					}
					this.connect(B.input[inNum]);
				} else {
					this.connect(B.input, outNum, inNum);
				}
			} else {
				try {
					if (B instanceof AudioNode){
						nativeConnect.call(this, B, outNum, inNum);
					} else {
						nativeConnect.call(this, B, outNum);
					}
				} catch (e) {
					throw new Error("error connecting to node: "+B+"\n"+e);
				}
			}
		};

		var nativeDisconnect = AudioNode.prototype.disconnect;
		//replace the old disconnect method
		AudioNode.prototype.disconnect = function toneDisconnect(B, outNum, inNum){
			if (B && B.input && Array.isArray(B.input)){
				if (isUndef(inNum)){
					inNum = 0;
				}
				this.disconnect(B.input[inNum], outNum, inNum);
			} else if (B && B.input){
				this.disconnect(B.input, outNum, inNum);
			} else {
				try {
					nativeDisconnect.apply(this, arguments);
				} catch (e) {
					throw new Error("error disconnecting node: "+B+"\n"+e);
				}
			}
		};

		if (!isFunction(AudioContext.prototype.createGain)){
			AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
		}
		if (!isFunction(AudioContext.prototype.createDelay)){
			AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
		}
		if (!isFunction(AudioContext.prototype.createPeriodicWave)){
			AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;
		}
		if (!isFunction(AudioBufferSourceNode.prototype.start)){
			AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteGrainOn;
		}
		if (!isFunction(AudioBufferSourceNode.prototype.stop)){
			AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff;
		}
		if (!isFunction(OscillatorNode.prototype.start)){
			OscillatorNode.prototype.start = OscillatorNode.prototype.noteOn;
		}
		if (!isFunction(OscillatorNode.prototype.stop)){
			OscillatorNode.prototype.stop = OscillatorNode.prototype.noteOff;
		}
		if (!isFunction(OscillatorNode.prototype.setPeriodicWave)){
			OscillatorNode.prototype.setPeriodicWave = OscillatorNode.prototype.setWaveTable;
		}
	}

	// set the audio context initially
	if (supported){
		shimAudioContext();
		context = new Context();
	} else {
		console.warn("This browser does not support js");
	}
