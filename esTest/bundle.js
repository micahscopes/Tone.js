(function () {
	'use strict';

	///////////////////////////////////////////////////////////////////////////
		//	TONE
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  @class  Tone is the base class of all other classes. It provides
		 *          a lot of methods and functionality to all classes that extend
		 *          it.
		 *
		 *  @constructor
		 *  @alias Tone
		 *  @param {number} [inputs=1] the number of input nodes
		 *  @param {number} [outputs=1] the number of output nodes
		 */
		var Tone$1 = function(inputs, outputs){

			/**
			 *  the input node(s)
			 *  @type {GainNode|Array}
			 */
			if (this.isUndef(inputs) || inputs === 1){
				this.input = this.context.createGain();
			} else if (inputs > 1){
				this.input = new Array(inputs);
			}

			/**
			 *  the output node(s)
			 *  @type {GainNode|Array}
			 */
			if (this.isUndef(outputs) || outputs === 1){
				this.output = this.context.createGain();
			} else if (outputs > 1){
				this.output = new Array(inputs);
			}
		};

		/**
		 *  Set the parameters at once. Either pass in an
		 *  object mapping parameters to values, or to set a
		 *  single parameter, by passing in a string and value.
		 *  The last argument is an optional ramp time which
		 *  will ramp any signal values to their destination value
		 *  over the duration of the rampTime.
		 *  @param {Object|string} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {Tone} this
		 *  @example
		 * //set values using an object
		 * filter.set({
		 * 	"frequency" : 300,
		 * 	"type" : highpass
		 * });
		 *  @example
		 * filter.set("type", "highpass");
		 *  @example
		 * //ramp to the value 220 over 3 seconds.
		 * oscillator.set({
		 * 	"frequency" : 220
		 * }, 3);
		 */
		Tone$1.prototype.set = function(params, value, rampTime){
			if (this.isObject(params)){
				rampTime = value;
			} else if (this.isString(params)){
				var tmpObj = {};
				tmpObj[params] = value;
				params = tmpObj;
			}

			paramLoop:
			for (var attr in params){
				value = params[attr];
				var parent = this;
				if (attr.indexOf(".") !== -1){
					var attrSplit = attr.split(".");
					for (var i = 0; i < attrSplit.length - 1; i++){
						parent = parent[attrSplit[i]];
						if (parent instanceof Tone$1) {
							attrSplit.splice(0,i+1);
							var innerParam = attrSplit.join(".");
							parent.set(innerParam, value);
							continue paramLoop;
						}
					}
					attr = attrSplit[attrSplit.length - 1];
				}
				var param = parent[attr];
				if (this.isUndef(param)){
					continue;
				}
				if ((Tone$1.Signal && param instanceof Tone$1.Signal) ||
						(Tone$1.Param && param instanceof Tone$1.Param)){
					if (param.value !== value){
						if (this.isUndef(rampTime)){
							param.value = value;
						} else {
							param.rampTo(value, rampTime);
						}
					}
				} else if (param instanceof AudioParam){
					if (param.value !== value){
						param.value = value;
					}
				} else if (param instanceof Tone$1){
					param.set(value);
				} else if (param !== value){
					parent[attr] = value;
				}
			}
			return this;
		};

		/**
		 *  Get the object's attributes. Given no arguments get
		 *  will return all available object properties and their corresponding
		 *  values. Pass in a single attribute to retrieve or an array
		 *  of attributes. The attribute strings can also include a "."
		 *  to access deeper properties.
		 *  @example
		 * osc.get();
		 * //returns {"type" : "sine", "frequency" : 440, ...etc}
		 *  @example
		 * osc.get("type");
		 * //returns { "type" : "sine"}
		 * @example
		 * //use dot notation to access deep properties
		 * synth.get(["envelope.attack", "envelope.release"]);
		 * //returns {"envelope" : {"attack" : 0.2, "release" : 0.4}}
		 *  @param {Array=|string|undefined} params the parameters to get, otherwise will return
		 *  					                  all available.
		 *  @returns {Object}
		 */
		Tone$1.prototype.get = function(params){
			if (this.isUndef(params)){
				params = this._collectDefaults(this.constructor);
			} else if (this.isString(params)){
				params = [params];
			}
			var ret = {};
			for (var i = 0; i < params.length; i++){
				var attr = params[i];
				var parent = this;
				var subRet = ret;
				if (attr.indexOf(".") !== -1){
					var attrSplit = attr.split(".");
					for (var j = 0; j < attrSplit.length - 1; j++){
						var subAttr = attrSplit[j];
						subRet[subAttr] = subRet[subAttr] || {};
						subRet = subRet[subAttr];
						parent = parent[subAttr];
					}
					attr = attrSplit[attrSplit.length - 1];
				}
				var param = parent[attr];
				if (this.isObject(params[attr])){
					subRet[attr] = param.get();
				} else if (Tone$1.Signal && param instanceof Tone$1.Signal){
					subRet[attr] = param.value;
				} else if (Tone$1.Param && param instanceof Tone$1.Param){
					subRet[attr] = param.value;
				} else if (param instanceof AudioParam){
					subRet[attr] = param.value;
				} else if (param instanceof Tone$1){
					subRet[attr] = param.get();
				} else if (!this.isFunction(param) && !this.isUndef(param)){
					subRet[attr] = param;
				}
			}
			return ret;
		};

		/**
		 *  collect all of the default attributes in one
		 *  @private
		 *  @param {function} constr the constructor to find the defaults from
		 *  @return {Array} all of the attributes which belong to the class
		 */
		Tone$1.prototype._collectDefaults = function(constr){
			var ret = [];
			if (!this.isUndef(constr.defaults)){
				ret = Object.keys(constr.defaults);
			}
			if (!this.isUndef(constr._super)){
				var superDefs = this._collectDefaults(constr._super);
				//filter out repeats
				for (var i = 0; i < superDefs.length; i++){
					if (ret.indexOf(superDefs[i]) === -1){
						ret.push(superDefs[i]);
					}
				}
			}
			return ret;
		};

		/**
		 *  @returns {string} returns the name of the class as a string
		 */
		Tone$1.prototype.toString = function(){
			for (var className in Tone$1){
				var isLetter = className[0].match(/^[A-Z]$/);
				var sameConstructor =  Tone$1[className] === this.constructor;
				if (this.isFunction(Tone$1[className]) && isLetter && sameConstructor){
					return className;
				}
			}
			return "Tone";
		};

		///////////////////////////////////////////////////////////////////////////
		//	CLASS VARS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  The number of inputs feeding into the AudioNode.
		 *  For source nodes, this will be 0.
		 *  @memberOf Tone#
		 *  @name numberOfInputs
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1.prototype, "numberOfInputs", {
			get : function(){
				if (this.input){
					if (this.isArray(this.input)){
						return this.input.length;
					} else {
						return 1;
					}
				} else {
					return 0;
				}
			}
		});

		/**
		 *  The number of outputs coming out of the AudioNode.
		 *  For source nodes, this will be 0.
		 *  @memberOf Tone#
		 *  @name numberOfInputs
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1.prototype, "numberOfOutputs", {
			get : function(){
				if (this.output){
					if (this.isArray(this.output)){
						return this.output.length;
					} else {
						return 1;
					}
				} else {
					return 0;
				}
			}
		});

		///////////////////////////////////////////////////////////////////////////
		//	CONNECTIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  disconnect and dispose
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.dispose = function(){
			if (!this.isUndef(this.input)){
				if (this.input instanceof AudioNode){
					this.input.disconnect();
				}
				this.input = null;
			}
			if (!this.isUndef(this.output)){
				if (this.output instanceof AudioNode){
					this.output.disconnect();
				}
				this.output = null;
			}
			return this;
		};

		/**
		 *  connect the output of a ToneNode to an AudioParam, AudioNode, or ToneNode
		 *  @param  {Tone | AudioParam | AudioNode} unit
		 *  @param {number} [outputNum=0] optionally which output to connect from
		 *  @param {number} [inputNum=0] optionally which input to connect to
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.connect = function(unit, outputNum, inputNum){
			if (Array.isArray(this.output)){
				outputNum = this.defaultArg(outputNum, 0);
				this.output[outputNum].connect(unit, 0, inputNum);
			} else {
				this.output.connect(unit, outputNum, inputNum);
			}
			return this;
		};

		/**
		 *  disconnect the output
		 *  @param {Number|AudioNode} output Either the output index to disconnect
		 *                                   if the output is an array, or the
		 *                                   node to disconnect from.
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.disconnect = function(destination, outputNum, inputNum){
			if (this.isArray(this.output)){
				if (this.isNumber(destination)){
					this.output[destination].disconnect();
				} else {
					outputNum = this.defaultArg(outputNum, 0);
					this.output[outputNum].disconnect(destination, 0, inputNum);
				}
			} else {
				this.output.disconnect.apply(this.output, arguments);
			}
		};

		/**
		 *  connect together all of the arguments in series
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.connectSeries = function(){
			if (arguments.length > 1){
				var currentUnit = arguments[0];
				for (var i = 1; i < arguments.length; i++){
					var toUnit = arguments[i];
					currentUnit.connect(toUnit);
					currentUnit = toUnit;
				}
			}
			return this;
		};

		/**
		 *  Connect the output of this node to the rest of the nodes in series.
		 *  @example
		 *  //connect a node to an effect, panVol and then to the master output
		 *  node.chain(effect, panVol, Tone.Master);
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.chain = function(){
			if (arguments.length > 0){
				var currentUnit = this;
				for (var i = 0; i < arguments.length; i++){
					var toUnit = arguments[i];
					currentUnit.connect(toUnit);
					currentUnit = toUnit;
				}
			}
			return this;
		};

		/**
		 *  connect the output of this node to the rest of the nodes in parallel.
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
		Tone$1.prototype.fan = function(){
			if (arguments.length > 0){
				for (var i = 0; i < arguments.length; i++){
					this.connect(arguments[i]);
				}
			}
			return this;
		};

		//give native nodes chain and fan methods
		AudioNode.prototype.chain = Tone$1.prototype.chain;
		AudioNode.prototype.fan = Tone$1.prototype.fan;

		///////////////////////////////////////////////////////////////////////////
		//	UTILITIES / HELPERS / MATHS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  If the `given` parameter is undefined, use the `fallback`.
		 *  If both `given` and `fallback` are object literals, it will
		 *  return a deep copy which includes all of the parameters from both
		 *  objects. If a parameter is undefined in given, it will return
		 *  the fallback property.
		 *  <br><br>
		 *  WARNING: if object is self referential, it will go into an an
		 *  infinite recursive loop.
		 *
		 *  @param  {*} given
		 *  @param  {*} fallback
		 *  @return {*}
		 */
		Tone$1.prototype.defaultArg = function(given, fallback){
			if (this.isObject(given) && this.isObject(fallback)){
				var ret = {};
				//make a deep copy of the given object
				for (var givenProp in given) {
					ret[givenProp] = this.defaultArg(fallback[givenProp], given[givenProp]);
				}
				for (var fallbackProp in fallback) {
					ret[fallbackProp] = this.defaultArg(given[fallbackProp], fallback[fallbackProp]);
				}
				return ret;
			} else {
				return this.isUndef(given) ? fallback : given;
			}
		};

		/**
		 *  returns the args as an options object with given arguments
		 *  mapped to the names provided.
		 *
		 *  if the args given is an array containing only one object, it is assumed
		 *  that that's already the options object and will just return it.
		 *
		 *  @param  {Array} values  the 'arguments' object of the function
		 *  @param  {Array} keys the names of the arguments as they
		 *                                 should appear in the options object
		 *  @param {Object=} defaults optional defaults to mixin to the returned
		 *                            options object
		 *  @return {Object}       the options object with the names mapped to the arguments
		 */
		Tone$1.prototype.optionsObject = function(values, keys, defaults){
			var options = {};
			if (values.length === 1 && this.isObject(values[0])){
				options = values[0];
			} else {
				for (var i = 0; i < keys.length; i++){
					options[keys[i]] = values[i];
				}
			}
			if (!this.isUndef(defaults)){
				return this.defaultArg(options, defaults);
			} else {
				return options;
			}
		};

		///////////////////////////////////////////////////////////////////////////
		// TYPE CHECKING
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  test if the arg is undefined
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is undefined
		 *  @function
		 */
		Tone$1.prototype.isUndef = function(val){
			return typeof val === "undefined";
		};

		/**
		 *  test if the arg is a function
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a function
		 *  @function
		 */
		Tone$1.prototype.isFunction = function(val){
			return typeof val === "function";
		};

		/**
		 *  Test if the argument is a number.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a number
		 */
		Tone$1.prototype.isNumber = function(arg){
			return (typeof arg === "number");
		};

		/**
		 *  Test if the given argument is an object literal (i.e. `{}`);
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is an object literal.
		 */
		Tone$1.prototype.isObject = function(arg){
			return (Object.prototype.toString.call(arg) === "[object Object]" && arg.constructor === Object);
		};

		/**
		 *  Test if the argument is a boolean.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a boolean
		 */
		Tone$1.prototype.isBoolean = function(arg){
			return (typeof arg === "boolean");
		};

		/**
		 *  Test if the argument is an Array
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is an array
		 */
		Tone$1.prototype.isArray = function(arg){
			return (Array.isArray(arg));
		};

		/**
		 *  Test if the argument is a string.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a string
		 */
		Tone$1.prototype.isString = function(arg){
			return (typeof arg === "string");
		};

	 	/**
		 *  An empty function.
		 *  @static
		 */
		Tone$1.noOp = function(){};

		/**
		 *  Make the property not writable. Internal use only.
		 *  @private
		 *  @param  {string}  property  the property to make not writable
		 */
		Tone$1.prototype._readOnly = function(property){
			if (Array.isArray(property)){
				for (var i = 0; i < property.length; i++){
					this._readOnly(property[i]);
				}
			} else {
				Object.defineProperty(this, property, {
					writable: false,
					enumerable : true,
				});
			}
		};

		/**
		 *  Make an attribute writeable. Interal use only.
		 *  @private
		 *  @param  {string}  property  the property to make writable
		 */
		Tone$1.prototype._writable = function(property){
			if (Array.isArray(property)){
				for (var i = 0; i < property.length; i++){
					this._writable(property[i]);
				}
			} else {
				Object.defineProperty(this, property, {
					writable: true,
				});
			}
		};

		/**
		 * Possible play states.
		 * @enum {string}
		 */
		Tone$1.State = {
			Started : "started",
			Stopped : "stopped",
			Paused : "paused",
	 	};

		///////////////////////////////////////////////////////////////////////////
		// CONVERSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Equal power gain scale. Good for cross-fading.
		 *  @param  {NormalRange} percent (0-1)
		 *  @return {Number}         output gain (0-1)
		 */
		Tone$1.prototype.equalPowerScale = function(percent){
			var piFactor = 0.5 * Math.PI;
			return Math.sin(percent * piFactor);
		};

		/**
		 *  Convert decibels into gain.
		 *  @param  {Decibels} db
		 *  @return {Number}
		 */
		Tone$1.prototype.dbToGain = function(db) {
			return Math.pow(2, db / 6);
		};

		/**
		 *  Convert gain to decibels.
		 *  @param  {Number} gain (0-1)
		 *  @return {Decibels}
		 */
		Tone$1.prototype.gainToDb = function(gain) {
			return  20 * (Math.log(gain) / Math.LN10);
		};

		/**
		 *  Convert an interval (in semitones) to a frequency ratio.
		 *  @param  {Interval} interval the number of semitones above the base note
		 *  @return {number}          the frequency ratio
		 *  @example
		 * tone.intervalToFrequencyRatio(0); // 1
		 * tone.intervalToFrequencyRatio(12); // 2
		 * tone.intervalToFrequencyRatio(-12); // 0.5
		 */
		Tone$1.prototype.intervalToFrequencyRatio = function(interval){
			return Math.pow(2,(interval/12));
		};

		///////////////////////////////////////////////////////////////////////////
		//	TIMING
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Return the current time of the AudioContext clock.
		 *  @return {Number} the currentTime from the AudioContext
		 */
		Tone$1.prototype.now = function(){
			return Tone$1.context.now();
		};

		/**
		 *  Return the current time of the AudioContext clock.
		 *  @return {Number} the currentTime from the AudioContext
		 *  @static
		 */
		Tone$1.now = function(){
			return Tone$1.context.now();
		};

		///////////////////////////////////////////////////////////////////////////
		//	INHERITANCE
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  have a child inherit all of Tone's (or a parent's) Tone.prototype
		 *  to inherit the parent's properties, make sure to call
		 *  Parent.call(this) in the child's constructor
		 *
		 *  based on closure library's inherit function
		 *
		 *  @static
		 *  @param  {function} 	child
		 *  @param  {function=} parent (optional) parent to inherit from
		 *                             if no parent is supplied, the child
		 *                             will inherit from Tone
		 */
		Tone$1.extend = function(child, parent){
			if (Tone$1.prototype.isUndef(parent)){
				parent = Tone$1;
			}
			function TempConstructor(){}
			TempConstructor.prototype = parent.prototype;
			child.prototype = new TempConstructor();
			/** @override */
			child.prototype.constructor = child;
			child._super = parent;
		};

		///////////////////////////////////////////////////////////////////////////
		//	CONTEXT
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  The private audio context shared by all Tone Nodes.
		 *  @private
		 *  @type {Tone.Context|undefined}
		 */
		var audioContext;

		/**
		 *  A static pointer to the audio context accessible as Tone.context.
		 *  @type {Tone.Context}
		 *  @name context
		 *  @memberOf Tone
		 */
		Object.defineProperty(Tone$1, "context", {
			get : function(){
				return audioContext;
			},
			set : function(context){
				if (Tone$1.Context && context instanceof Tone$1.Context){
					audioContext = context;
				} else {
					audioContext = new Tone$1.Context(context);
				}
				//initialize the new audio context
				if (Tone$1.Context){
					Tone$1.Context.emit("init", audioContext);
				}
			}
		});

		/**
		 *  The AudioContext
		 *  @type {Tone.Context}
		 *  @name context
		 *  @memberOf Tone#
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1.prototype, "context", {
			get : function(){
				return Tone$1.context;
			}
		});

		/**
		 *  Tone automatically creates a context on init, but if you are working
		 *  with other libraries which also create an AudioContext, it can be
		 *  useful to set your own. If you are going to set your own context,
		 *  be sure to do it at the start of your code, before creating any objects.
		 *  @static
		 *  @param {AudioContext} ctx The new audio context to set
		 */
		Tone$1.setContext = function(ctx){
			Tone$1.context = ctx;
		};

		/**
		 *  The number of seconds of 1 processing block (128 samples)
		 *  @type {Number}
		 *  @name blockTime
		 *  @memberOf Tone#
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1.prototype, "blockTime", {
			get : function(){
				return 128 / this.context.sampleRate;
			}
		});

		/**
		 *  The duration in seconds of one sample.
		 *  @type {Number}
		 *  @name sampleTime
		 *  @memberOf Tone#
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1.prototype, "sampleTime", {
			get : function(){
				return 1 / this.context.sampleRate;
			}
		});

		/**
		 *  Whether or not all the technologies that Tone.js relies on are supported by the current browser.
		 *  @type {Boolean}
		 *  @name supported
		 *  @memberOf Tone
		 *  @readOnly
		 */
		Object.defineProperty(Tone$1, "supported", {
			get : function(){
				var hasAudioContext = window.hasOwnProperty("AudioContext") || window.hasOwnProperty("webkitAudioContext");
				var hasPromises = window.hasOwnProperty("Promise");
				return hasAudioContext && hasPromises;
			}
		});

		/**
		 *  array of callbacks to be invoked when a new context is added
		 *  @private
		 */
		var newContextCallbacks = [];

		/**
		 *  invoke this callback when a new context is added
		 *  will be invoked initially with the first context
		 *  @private
		 *  @static
		 *  @param {function(AudioContext)} callback the callback to be invoked with the audio context
		 */
		Tone$1._initAudioContext = function(callback){
			//invoke the callback with the existing AudioContext
			callback(Tone$1.context);
			//add it to the array
			newContextCallbacks.push(callback);
		};

		Tone$1.version = "r10-dev";

		// allow optional silencing of this log
		if (!window.TONE_SILENCE_VERSION_LOGGING) {
			console.log("%c * Tone.js " + Tone$1.version + " * ", "background: #000; color: #fff");
		}

	/**
		 *  @class TimeBase is a flexible encoding of time
		 *         which can be evaluated to and from a string.
		 *         Parsing code modified from https://code.google.com/p/tapdigit/
		 *         Copyright 2011 2012 Ariya Hidayat, New BSD License
		 *  @extends {Tone}
		 *  @param  {Time}  val    The time value as a number or string
		 *  @param  {String=}  units  Unit values
		 *  @example
		 * TimeBase(4, "n")
		 * TimeBase(2, "t")
		 * TimeBase("2t").add("1m")
		 * TimeBase("2t + 1m");
		 */
		var TimeBase$1 = function(val, units){

			//allows it to be constructed with or without 'new'
			if (this instanceof TimeBase$1) {

				/**
				 *  Any expressions parsed from the Time
				 *  @type  {Array}
				 *  @private
				 */
				this._expr = this._noOp;

				if (val instanceof TimeBase$1){
					this.copy(val);
				} else if (!this.isUndef(units) || this.isNumber(val)){
					//default units
					units = this.defaultArg(units, this._defaultUnits);
					var method = this._primaryExpressions[units].method;
					this._expr = method.bind(this, val);
				} else if (this.isString(val)){
					this.set(val);
				} else if (this.isUndef(val)){
					//default expression
					this._expr = this._defaultExpr();
				}
			} else {

				return new TimeBase$1(val, units);
			}
		};

		Tone$1.extend(TimeBase$1);

		/**
		 *  Repalce the current time value with the value
		 *  given by the expression string.
		 *  @param  {String}  exprString
		 *  @return {TimeBase} this
		 */
		TimeBase$1.prototype.set = function(exprString){
			this._expr = this._parseExprString(exprString);
			return this;
		};

		/**
		 *  Return a clone of the TimeBase object.
		 *  @return  {TimeBase} The new cloned TimeBase
		 */
		TimeBase$1.prototype.clone = function(){
			var instance = new this.constructor();
			instance.copy(this);
			return instance;
		};

		/**
		 *  Copies the value of time to this Time
		 *  @param {TimeBase} time
		 *  @return  {TimeBase}
		 */
		TimeBase$1.prototype.copy = function(time){
			var val = time._expr();
			return this.set(val);
		};

		///////////////////////////////////////////////////////////////////////////
		//	ABSTRACT SYNTAX TREE PARSER
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  All the primary expressions.
		 *  @private
		 *  @type  {Object}
		 */
		TimeBase$1.prototype._primaryExpressions = {
			"n" : {
				regexp : /^(\d+)n/i,
				method : function(value){
					value = parseInt(value);
					if (value === 1){
						return this._beatsToUnits(this._timeSignature());
					} else {
						return this._beatsToUnits(4 / value);
					}
				}
			},
			"t" : {
				regexp : /^(\d+)t/i,
				method : function(value){
					value = parseInt(value);
					return this._beatsToUnits(8 / (parseInt(value) * 3));
				}
			},
			"m" : {
				regexp : /^(\d+)m/i,
				method : function(value){
					return this._beatsToUnits(parseInt(value) * this._timeSignature());
				}
			},
			"i" : {
				regexp : /^(\d+)i/i,
				method : function(value){
					return this._ticksToUnits(parseInt(value));
				}
			},
			"hz" : {
				regexp : /^(\d+(?:\.\d+)?)hz/i,
				method : function(value){
					return this._frequencyToUnits(parseFloat(value));
				}
			},
			"tr" : {
				regexp : /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
				method : function(m, q, s){
					var total = 0;
					if (m && m !== "0"){
						total += this._beatsToUnits(this._timeSignature() * parseFloat(m));
					}
					if (q && q !== "0"){
						total += this._beatsToUnits(parseFloat(q));
					}
					if (s && s !== "0"){
						total += this._beatsToUnits(parseFloat(s) / 4);
					}
					return total;
				}
			},
			"s" : {
				regexp : /^(\d+(?:\.\d+)?s)/,
				method : function(value){
					return this._secondsToUnits(parseFloat(value));
				}
			},
			"samples" : {
				regexp : /^(\d+)samples/,
				method : function(value){
					return parseInt(value) / this.context.sampleRate;
				}
			},
			"default" : {
				regexp : /^(\d+(?:\.\d+)?)/,
				method : function(value){
					return this._primaryExpressions[this._defaultUnits].method.call(this, value);
				}
			}
		};

		/**
		 *  All the binary expressions that TimeBase can accept.
		 *  @private
		 *  @type  {Object}
		 */
		TimeBase$1.prototype._binaryExpressions = {
			"+" : {
				regexp : /^\+/,
				precedence : 2,
				method : function(lh, rh){
					return lh() + rh();
				}
			},
			"-" : {
				regexp : /^\-/,
				precedence : 2,
				method : function(lh, rh){
					return lh() - rh();
				}
			},
			"*" : {
				regexp : /^\*/,
				precedence : 1,
				method : function(lh, rh){
					return lh() * rh();
				}
			},
			"/" : {
				regexp : /^\//,
				precedence : 1,
				method : function(lh, rh){
					return lh() / rh();
				}
			}
		};

		/**
		 *  All the unary expressions.
		 *  @private
		 *  @type  {Object}
		 */
		TimeBase$1.prototype._unaryExpressions = {
			"neg" : {
				regexp : /^\-/,
				method : function(lh){
					return -lh();
				}
			}
		};

		/**
		 *  Syntactic glue which holds expressions together
		 *  @private
		 *  @type  {Object}
		 */
		TimeBase$1.prototype._syntaxGlue = {
			"(" : {
				regexp : /^\(/
			},
			")" : {
				regexp : /^\)/
			}
		};

		/**
		 *  tokenize the expression based on the Expressions object
		 *  @param   {string} expr
		 *  @return  {Object}      returns two methods on the tokenized list, next and peek
		 *  @private
		 */
		TimeBase$1.prototype._tokenize = function(expr){
			var position = -1;
			var tokens = [];

			while(expr.length > 0){
				expr = expr.trim();
				var token = getNextToken(expr, this);
				tokens.push(token);
				expr = expr.substr(token.value.length);
			}

			function getNextToken(expr, context){
				var expressions = ["_binaryExpressions", "_unaryExpressions", "_primaryExpressions", "_syntaxGlue"];
				for (var i = 0; i < expressions.length; i++){
					var group = context[expressions[i]];
					for (var opName in group){
						var op = group[opName];
						var reg = op.regexp;
						var match = expr.match(reg);
						if (match !== null){
							return {
								method : op.method,
								precedence : op.precedence,
								regexp : op.regexp,
								value : match[0],
							};
						}
					}
				}
				throw new SyntaxError("TimeBase: Unexpected token "+expr);
			}

			return {
				next : function(){
					return tokens[++position];
				},
				peek : function(){
					return tokens[position + 1];
				}
			};
		};

		/**
		 *  Given a token, find the value within the groupName
		 *  @param {Object} token
		 *  @param {String} groupName
		 *  @param {Number} precedence
		 *  @private
		 */
		TimeBase$1.prototype._matchGroup = function(token, group, prec) {
			var ret = false;
			if (!this.isUndef(token)){
				for (var opName in group){
					var op = group[opName];
					if (op.regexp.test(token.value)){
						if (!this.isUndef(prec)){
							if(op.precedence === prec){
								return op;
							}
						} else {
							return op;
						}
					}
				}
			}
			return ret;
		};

		/**
		 *  Match a binary expression given the token and the precedence
		 *  @param {Lexer} lexer
		 *  @param {Number} precedence
		 *  @private
		 */
		TimeBase$1.prototype._parseBinary = function(lexer, precedence){
			if (this.isUndef(precedence)){
				precedence = 2;
			}
			var expr;
			if (precedence < 0){
				expr = this._parseUnary(lexer);
			} else {
				expr = this._parseBinary(lexer, precedence - 1);
			}
			var token = lexer.peek();
			while (token && this._matchGroup(token, this._binaryExpressions, precedence)){
				token = lexer.next();
				expr = token.method.bind(this, expr, this._parseBinary(lexer, precedence - 1));
				token = lexer.peek();
			}
			return expr;
		};

		/**
		 *  Match a unary expression.
		 *  @param {Lexer} lexer
		 *  @private
		 */
		TimeBase$1.prototype._parseUnary = function(lexer){
			var token, expr;
			token = lexer.peek();
			var op = this._matchGroup(token, this._unaryExpressions);
			if (op) {
				token = lexer.next();
				expr = this._parseUnary(lexer);
				return op.method.bind(this, expr);
			}
			return this._parsePrimary(lexer);
		};

		/**
		 *  Match a primary expression (a value).
		 *  @param {Lexer} lexer
		 *  @private
		 */
		TimeBase$1.prototype._parsePrimary = function(lexer){
			var token, expr;
			token = lexer.peek();
			if (this.isUndef(token)) {
				throw new SyntaxError("TimeBase: Unexpected end of expression");
			}
			if (this._matchGroup(token, this._primaryExpressions)) {
				token = lexer.next();
				var matching = token.value.match(token.regexp);
				return token.method.bind(this, matching[1], matching[2], matching[3]);
			}
			if (token && token.value === "("){
				lexer.next();
				expr = this._parseBinary(lexer);
				token = lexer.next();
				if (!(token && token.value === ")")) {
					throw new SyntaxError("Expected )");
				}
				return expr;
			}
			throw new SyntaxError("TimeBase: Cannot process token " + token.value);
		};

		/**
		 *  Recursively parse the string expression into a syntax tree.
		 *  @param   {string} expr
		 *  @return  {Function} the bound method to be evaluated later
		 *  @private
		 */
		TimeBase$1.prototype._parseExprString = function(exprString){
			if (!this.isString(exprString)){
				exprString = exprString.toString();
			}
			var lexer = this._tokenize(exprString);
			var tree = this._parseBinary(lexer);
			return tree;
		};

		///////////////////////////////////////////////////////////////////////////
		//	DEFAULTS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  The initial expression value
		 *  @return  {Number}  The initial value 0
		 *  @private
		 */
		TimeBase$1.prototype._noOp = function(){
			return 0;
		};

		/**
		 *  The default expression value if no arguments are given
		 *  @private
		 */
		TimeBase$1.prototype._defaultExpr = function(){
			return this._noOp;
		};

		/**
		 *  The default units if none are given.
		 *  @private
		 */
		TimeBase$1.prototype._defaultUnits = "s";

		///////////////////////////////////////////////////////////////////////////
		//	UNIT CONVERSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Returns the value of a frequency in the current units
		 *  @param {Frequency} freq
		 *  @return  {Number}
		 *  @private
		 */
		TimeBase$1.prototype._frequencyToUnits = function(freq){
			return 1/freq;
		};

		/**
		 *  Return the value of the beats in the current units
		 *  @param {Number} beats
		 *  @return  {Number}
		 *  @private
		 */
		TimeBase$1.prototype._beatsToUnits = function(beats){
			return (60 / Transport.bpm.value) * beats;
		};

		/**
		 *  Returns the value of a second in the current units
		 *  @param {Seconds} seconds
		 *  @return  {Number}
		 *  @private
		 */
		TimeBase$1.prototype._secondsToUnits = function(seconds){
			return seconds;
		};

		/**
		 *  Returns the value of a tick in the current time units
		 *  @param {Ticks} ticks
		 *  @return  {Number}
		 *  @private
		 */
		TimeBase$1.prototype._ticksToUnits = function(ticks){
			return ticks * (this._beatsToUnits(1) / Transport.PPQ);
		};

		/**
		 *  Return the time signature.
		 *  @return  {Number}
		 *  @private
		 */
		TimeBase$1.prototype._timeSignature = function(){
			return Transport.timeSignature;
		};

		///////////////////////////////////////////////////////////////////////////
		//	EXPRESSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Push an expression onto the expression list
		 *  @param  {Time}  val
		 *  @param  {String}  type
		 *  @param  {String}  units
		 *  @return  {TimeBase}
		 *  @private
		 */
		TimeBase$1.prototype._pushExpr = function(val, name, units){
			//create the expression
			if (!(val instanceof TimeBase$1)){
				val = new this.constructor(val, units);
			}
			this._expr = this._binaryExpressions[name].method.bind(this, this._expr, val._expr);
			return this;
		};

		/**
		 *  Add to the current value.
		 *  @param  {Time}  val    The value to add
		 *  @param  {String=}  units  Optional units to use with the value.
		 *  @return  {TimeBase}  this
		 *  @example
		 * TimeBase("2m").add("1m"); //"3m"
		 */
		TimeBase$1.prototype.add = function(val, units){
			return this._pushExpr(val, "+", units);
		};

		/**
		 *  Subtract the value from the current time.
		 *  @param  {Time}  val    The value to subtract
		 *  @param  {String=}  units  Optional units to use with the value.
		 *  @return  {TimeBase}  this
		 *  @example
		 * TimeBase("2m").sub("1m"); //"1m"
		 */
		TimeBase$1.prototype.sub = function(val, units){
			return this._pushExpr(val, "-", units);
		};

		/**
		 *  Multiply the current value by the given time.
		 *  @param  {Time}  val    The value to multiply
		 *  @param  {String=}  units  Optional units to use with the value.
		 *  @return  {TimeBase}  this
		 *  @example
		 * TimeBase("2m").mult("2"); //"4m"
		 */
		TimeBase$1.prototype.mult = function(val, units){
			return this._pushExpr(val, "*", units);
		};

		/**
		 *  Divide the current value by the given time.
		 *  @param  {Time}  val    The value to divide by
		 *  @param  {String=}  units  Optional units to use with the value.
		 *  @return  {TimeBase}  this
		 *  @example
		 * TimeBase("2m").div(2); //"1m"
		 */
		TimeBase$1.prototype.div = function(val, units){
			return this._pushExpr(val, "/", units);
		};

		/**
		 *  Evaluate the time value. Returns the time
		 *  in seconds.
		 *  @return  {Seconds}
		 */
		TimeBase$1.prototype.eval = function(){
			return this._expr();
		};

		/**
		 *  Clean up
		 *  @return {TimeBase} this
		 */
		TimeBase$1.prototype.dispose = function(){
			this._expr = null;
		};

	/**
		 *  @class Time is a primitive type for encoding Time values.
		 *         Eventually all time values are evaluated to seconds
		 *         using the `eval` method. Time can be constructed
		 *         with or without the `new` keyword. Time can be passed
		 *         into the parameter of any method which takes time as an argument.
		 *  @constructor
		 *  @extends {TimeBase}
		 *  @param  {String|Number}  val    The time value.
		 *  @param  {String=}  units  The units of the value.
		 *  @example
		 * var t = Time("4n");//encodes a quarter note
		 * t.mult(4); // multiply that value by 4
		 * t.toNotation(); //returns "1m"
		 */
		var Time$1 = function(val, units){
			if (this instanceof Time$1){

				/**
				 *  If the current clock time should
				 *  be added to the output
				 *  @type  {Boolean}
				 *  @private
				 */
				this._plusNow = false;

				TimeBase$1.call(this, val, units);

			} else {
				return new Time$1(val, units);
			}
		};

		Tone$1.extend(Time$1, TimeBase$1);

		//clone the expressions so that
		//we can add more without modifying the original
		Time$1.prototype._unaryExpressions = Object.create(TimeBase$1.prototype._unaryExpressions);

		/*
		 *  Adds an additional unary expression
		 *  which quantizes values to the next subdivision
		 *  @type {Object}
		 *  @private
		 */
		Time$1.prototype._unaryExpressions.quantize = {
			regexp : /^@/,
			method : function(rh){
				return Transport.nextSubdivision(rh());
			}
		};

		/*
		 *  Adds an additional unary expression
		 *  which adds the current clock time.
		 *  @type {Object}
		 *  @private
		 */
		Time$1.prototype._unaryExpressions.now = {
			regexp : /^\+/,
			method : function(lh){
				this._plusNow = true;
				return lh();
			}
		};

		/**
		 *  Quantize the time by the given subdivision. Optionally add a
		 *  percentage which will move the time value towards the ideal
		 *  quantized value by that percentage.
		 *  @param  {Number|Time}  val    The subdivision to quantize to
		 *  @param  {NormalRange}  [percent=1]  Move the time value
		 *                                   towards the quantized value by
		 *                                   a percentage.
		 *  @return  {Time}  this
		 *  @example
		 * Time(21).quantize(2).eval() //returns 22
		 * Time(0.6).quantize("4n", 0.5).eval() //returns 0.55
		 */
		Time$1.prototype.quantize = function(subdiv, percent){
			percent = this.defaultArg(percent, 1);
			this._expr = function(expr, subdivision, percent){
				expr = expr();
				subdivision = subdivision.toSeconds();
				var multiple = Math.round(expr / subdivision);
				var ideal = multiple * subdivision;
				var diff = ideal - expr;
				return expr + diff * percent;
			}.bind(this, this._expr, new this.constructor(subdiv), percent);
			return this;
		};

		/**
		 *  Adds the clock time to the time expression at the
		 *  moment of evaluation.
		 *  @return  {Time}  this
		 */
		Time$1.prototype.addNow = function(){
			this._plusNow = true;
			return this;
		};

		/**
		 *  @override
		 *  Override the default value return when no arguments are passed in.
		 *  The default value is 'now'
		 *  @private
		 */
		Time$1.prototype._defaultExpr = function(){
			this._plusNow = true;
			return this._noOp;
		};

		/**
		 *  Copies the value of time to this Time
		 *  @param {Time} time
		 *  @return  {Time}
		 */
		Time$1.prototype.copy = function(time){
			TimeBase$1.prototype.copy.call(this, time);
			this._plusNow = time._plusNow;
			return this;
		};

		//CONVERSIONS//////////////////////////////////////////////////////////////

		/**
		 *  Convert a Time to Notation. Values will be thresholded to the nearest 128th note.
		 *  @return {Notation}
		 *  @example
		 * //if the Transport is at 120bpm:
		 * Time(2).toNotation();//returns "1m"
		 */
		Time$1.prototype.toNotation = function(){
			var time = this.toSeconds();
			var testNotations = ["1m", "2n", "4n", "8n", "16n", "32n", "64n", "128n"];
			var retNotation = this._toNotationHelper(time, testNotations);
			//try the same thing but with tripelets
			var testTripletNotations = ["1m", "2n", "2t", "4n", "4t", "8n", "8t", "16n", "16t", "32n", "32t", "64n", "64t", "128n"];
			var retTripletNotation = this._toNotationHelper(time, testTripletNotations);
			//choose the simpler expression of the two
			if (retTripletNotation.split("+").length < retNotation.split("+").length){
				return retTripletNotation;
			} else {
				return retNotation;
			}
		};

		/**
		 *  Helper method for Tone.toNotation
		 *  @param {Number} units
		 *  @param {Array} testNotations
		 *  @return {String}
		 *  @private
		 */
		Time$1.prototype._toNotationHelper = function(units, testNotations){
			//the threshold is the last value in the array
			var threshold = this._notationToUnits(testNotations[testNotations.length - 1]);
			var retNotation = "";
			for (var i = 0; i < testNotations.length; i++){
				var notationTime = this._notationToUnits(testNotations[i]);
				//account for floating point errors (i.e. round up if the value is 0.999999)
				var multiple = units / notationTime;
				var floatingPointError = 0.000001;
				if (1 - multiple % 1 < floatingPointError){
					multiple += floatingPointError;
				}
				multiple = Math.floor(multiple);
				if (multiple > 0){
					if (multiple === 1){
						retNotation += testNotations[i];
					} else {
						retNotation += multiple.toString() + "*" + testNotations[i];
					}
					units -= multiple * notationTime;
					if (units < threshold){
						break;
					} else {
						retNotation += " + ";
					}
				}
			}
			if (retNotation === ""){
				retNotation = "0";
			}
			return retNotation;
		};

		/**
		 *  Convert a notation value to the current units
		 *  @param  {Notation}  notation
		 *  @return  {Number}
		 *  @private
		 */
		Time$1.prototype._notationToUnits = function(notation){
			var primaryExprs = this._primaryExpressions;
			var notationExprs = [primaryExprs.n, primaryExprs.t, primaryExprs.m];
			for (var i = 0; i < notationExprs.length; i++){
				var expr = notationExprs[i];
				var match = notation.match(expr.regexp);
				if (match){
					return expr.method.call(this, match[1]);
				}
			}
		};

		/**
		 *  Return the time encoded as Bars:Beats:Sixteenths.
		 *  @return  {BarsBeatsSixteenths}
		 */
		Time$1.prototype.toBarsBeatsSixteenths = function(){
			var quarterTime = this._beatsToUnits(1);
			var quarters = this.toSeconds() / quarterTime;
			var measures = Math.floor(quarters / this._timeSignature());
			var sixteenths = (quarters % 1) * 4;
			quarters = Math.floor(quarters) % this._timeSignature();
			sixteenths = sixteenths.toString();
			if (sixteenths.length > 3){
				sixteenths = parseFloat(sixteenths).toFixed(3);
			}
			var progress = [measures, quarters, sixteenths];
			return progress.join(":");
		};

		/**
		 *  Return the time in ticks.
		 *  @return  {Ticks}
		 */
		Time$1.prototype.toTicks = function(){
			var quarterTime = this._beatsToUnits(1);
			var quarters = this.eval() / quarterTime;
			return Math.floor(quarters * Transport.PPQ);
		};

		/**
		 *  Return the time in samples
		 *  @return  {Samples}
		 */
		Time$1.prototype.toSamples = function(){
			return this.toSeconds() * this.context.sampleRate;
		};

		/**
		 *  Return the time as a frequency value
		 *  @return  {Frequency}
		 *  @example
		 * Time(2).toFrequency(); //0.5
		 */
		Time$1.prototype.toFrequency = function(){
			return 1/this.toSeconds();
		};

		/**
		 *  Return the time in seconds.
		 *  @return  {Seconds}
		 */
		Time$1.prototype.toSeconds = function(){
			return this.eval();
		};

		/**
		 *  Return the time in milliseconds.
		 *  @return  {Milliseconds}
		 */
		Time$1.prototype.toMilliseconds = function(){
			return this.toSeconds() * 1000;
		};

		/**
		 *  Return the time in seconds.
		 *  @return  {Seconds}
		 */
		Time$1.prototype.eval = function(){
			var val = this._expr();
			return val + (this._plusNow?this.now():0);
		};

	/**
		 *  @class Frequency is a primitive type for encoding Frequency values.
		 *         Eventually all time values are evaluated to hertz
		 *         using the `eval` method.
		 *  @constructor
		 *  @extends {TimeBase}
		 *  @param  {String|Number}  val    The time value.
		 *  @param  {String=}  units  The units of the value.
		 *  @example
		 * Frequency("C3").eval() // 261
		 * Frequency(38, "midi").eval() //
		 * Frequency("C3").transpose(4).eval();
		 */
		var Frequency = function(val, units){
			if (this instanceof Frequency){

				TimeBase$1.call(this, val, units);

			} else {
				return new Frequency(val, units);
			}
		};

		Tone$1.extend(Frequency, TimeBase$1);

		///////////////////////////////////////////////////////////////////////////
		//	AUGMENT BASE EXPRESSIONS
		///////////////////////////////////////////////////////////////////////////

		//clone the expressions so that
		//we can add more without modifying the original
		Frequency.prototype._primaryExpressions = Object.create(TimeBase$1.prototype._primaryExpressions);

		/*
		 *  midi type primary expression
		 *  @type {Object}
		 *  @private
		 */
		Frequency.prototype._primaryExpressions.midi = {
			regexp : /^(\d+(?:\.\d+)?midi)/,
			method : function(value){
				return this.midiToFrequency(value);
			}
		};

		/*
		 *  note type primary expression
		 *  @type {Object}
		 *  @private
		 */
		Frequency.prototype._primaryExpressions.note = {
			regexp : /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,
			method : function(pitch, octave){
				var index = noteToScaleIndex[pitch.toLowerCase()];
				var noteNumber = index + (parseInt(octave) + 1) * 12;
				return this.midiToFrequency(noteNumber);
			}
		};

		/*
		 *  BeatsBarsSixteenths type primary expression
		 *  @type {Object}
		 *  @private
		 */
		Frequency.prototype._primaryExpressions.tr = {
				regexp : /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
				method : function(m, q, s){
				var total = 1;
				if (m && m !== "0"){
					total *= this._beatsToUnits(this._timeSignature() * parseFloat(m));
				}
				if (q && q !== "0"){
					total *= this._beatsToUnits(parseFloat(q));
				}
				if (s && s !== "0"){
					total *= this._beatsToUnits(parseFloat(s) / 4);
				}
				return total;
			}
		};

		///////////////////////////////////////////////////////////////////////////
		//	EXPRESSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Transposes the frequency by the given number of semitones.
		 *  @param  {Interval}  interval
		 *  @return  {Frequency} this
		 *  @example
		 * Frequency("A4").transpose(3); //"C5"
		 */
		Frequency.prototype.transpose = function(interval){
			this._expr = function(expr, interval){
				var val = expr();
				return val * this.intervalToFrequencyRatio(interval);
			}.bind(this, this._expr, interval);
			return this;
		};

		/**
		 *  Takes an array of semitone intervals and returns
		 *  an array of frequencies transposed by those intervals.
		 *  @param  {Array}  intervals
		 *  @return  {Frequency} this
		 *  @example
		 * Frequency("A4").harmonize([0, 3, 7]); //["A4", "C5", "E5"]
		 */
		Frequency.prototype.harmonize = function(intervals){
			this._expr = function(expr, intervals){
				var val = expr();
				var ret = [];
				for (var i = 0; i < intervals.length; i++){
					ret[i] = val * this.intervalToFrequencyRatio(intervals[i]);
				}
				return ret;
			}.bind(this, this._expr, intervals);
			return this;
		};

		///////////////////////////////////////////////////////////////////////////
		//	UNIT CONVERSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Return the value of the frequency as a MIDI note
		 *  @return  {MIDI}
		 *  @example
		 * Frequency("C4").toMidi(); //60
		 */
		Frequency.prototype.toMidi = function(){
			return this.frequencyToMidi(this.eval());
		};

		/**
		 *  Return the value of the frequency in Scientific Pitch Notation
		 *  @return  {Note}
		 *  @example
		 * Frequency(69, "midi").toNote(); //"A4"
		 */
		Frequency.prototype.toNote = function(){
			var freq = this.eval();
			var log = Math.log(freq / Frequency.A4) / Math.LN2;
			var noteNumber = Math.round(12 * log) + 57;
			var octave = Math.floor(noteNumber/12);
			if(octave < 0){
				noteNumber += -12 * octave;
			}
			var noteName = scaleIndexToNote[noteNumber % 12];
			return noteName + octave.toString();
		};

		/**
		 *  Return the duration of one cycle in seconds.
		 *  @return  {Seconds}
		 */
		Frequency.prototype.toSeconds = function(){
			return 1 / this.eval();
		};

		/**
		 *  Return the value in Hertz
		 *  @return  {Frequency}
		 */
		Frequency.prototype.toFrequency = function(){
			return this.eval();
		};

		/**
		 *  Return the duration of one cycle in ticks
		 *  @return  {Ticks}
		 */
		Frequency.prototype.toTicks = function(){
			var quarterTime = this._beatsToUnits(1);
			var quarters = this.eval() / quarterTime;
			return Math.floor(quarters * Transport.PPQ);
		};

		///////////////////////////////////////////////////////////////////////////
		//	UNIT CONVERSIONS HELPERS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Returns the value of a frequency in the current units
		 *  @param {Frequency} freq
		 *  @return  {Number}
		 *  @private
		 */
		Frequency.prototype._frequencyToUnits = function(freq){
			return freq;
		};

		/**
		 *  Returns the value of a tick in the current time units
		 *  @param {Ticks} ticks
		 *  @return  {Number}
		 *  @private
		 */
		Frequency.prototype._ticksToUnits = function(ticks){
			return 1 / ((ticks * 60) / (Transport.bpm.value * Transport.PPQ));
		};

		/**
		 *  Return the value of the beats in the current units
		 *  @param {Number} beats
		 *  @return  {Number}
		 *  @private
		 */
		Frequency.prototype._beatsToUnits = function(beats){
			return 1 / TimeBase$1.prototype._beatsToUnits.call(this, beats);
		};

		/**
		 *  Returns the value of a second in the current units
		 *  @param {Seconds} seconds
		 *  @return  {Number}
		 *  @private
		 */
		Frequency.prototype._secondsToUnits = function(seconds){
			return 1 / seconds;
		};

		/**
		 *  The default units if none are given.
		 *  @private
		 */
		Frequency.prototype._defaultUnits = "hz";

		///////////////////////////////////////////////////////////////////////////
		//	FREQUENCY CONVERSIONS
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Note to scale index
		 *  @type  {Object}
		 */
		var noteToScaleIndex = {
			"cbb" : -2, "cb" : -1, "c" : 0,  "c#" : 1,  "cx" : 2,
			"dbb" : 0,  "db" : 1,  "d" : 2,  "d#" : 3,  "dx" : 4,
			"ebb" : 2,  "eb" : 3,  "e" : 4,  "e#" : 5,  "ex" : 6,
			"fbb" : 3,  "fb" : 4,  "f" : 5,  "f#" : 6,  "fx" : 7,
			"gbb" : 5,  "gb" : 6,  "g" : 7,  "g#" : 8,  "gx" : 9,
			"abb" : 7,  "ab" : 8,  "a" : 9,  "a#" : 10, "ax" : 11,
			"bbb" : 9,  "bb" : 10, "b" : 11, "b#" : 12, "bx" : 13,
		};

		/**
		 *  scale index to note (sharps)
		 *  @type  {Array}
		 */
		var scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

		/**
		 *  The [concert pitch](https://en.wikipedia.org/wiki/Concert_pitch)
		 *  A4's values in Hertz.
		 *  @type {Frequency}
		 *  @static
		 */
		Frequency.A4 = 440;

		/**
		 *  Convert a MIDI note to frequency value.
		 *  @param  {MIDI} midi The midi number to convert.
		 *  @return {Frequency} the corresponding frequency value
		 *  @example
		 * tone.midiToFrequency(69); // returns 440
		 */
		Frequency.prototype.midiToFrequency = function(midi){
			return Frequency.A4 * Math.pow(2, (midi - 69) / 12);
		};

		/**
		 *  Convert a frequency value to a MIDI note.
		 *  @param {Frequency} frequency The value to frequency value to convert.
		 *  @returns  {MIDI}
		 *  @example
		 * tone.midiToFrequency(440); // returns 69
		 */
		Frequency.prototype.frequencyToMidi = function(frequency){
			return 69 + 12 * Math.log(frequency / Frequency.A4) / Math.LN2;
		};

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
		var TransportTime$1 = function(val, units){
			if (this instanceof TransportTime$1){

				Time$1.call(this, val, units);

			} else {
				return new TransportTime$1(val, units);
			}
		};

		Tone$1.extend(TransportTime$1, Time$1);

		//clone the expressions so that
		//we can add more without modifying the original
		TransportTime$1.prototype._unaryExpressions = Object.create(Time$1.prototype._unaryExpressions);

		/**
		 *  Adds an additional unary expression
		 *  which quantizes values to the next subdivision
		 *  @type {Object}
		 *  @private
		 */
		TransportTime$1.prototype._unaryExpressions.quantize = {
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
		TransportTime$1.prototype._secondsToTicks = function(seconds){
			var quarterTime = this._beatsToUnits(1);
			var quarters = seconds / quarterTime;
			return Math.round(quarters * Transport.PPQ);
		};

		/**
		 *  Evaluate the time expression. Returns values in ticks
		 *  @return {Ticks}
		 */
		TransportTime$1.prototype.eval = function(){
			var val = this._secondsToTicks(this._expr());
			return val + (this._plusNow ? Transport.ticks : 0);
		};

		/**
		 *  Return the time in ticks.
		 *  @return  {Ticks}
		 */
		TransportTime$1.prototype.toTicks = function(){
			return this.eval();
		};

		/**
		 *  Return the time in seconds.
		 *  @return  {Seconds}
		 */
		TransportTime$1.prototype.toSeconds = function(){
			var val = this._expr();
			return val + (this._plusNow ? Transport.seconds : 0);
		};

		/**
		 *  Return the time as a frequency value
		 *  @return  {Frequency}
		 */
		TransportTime$1.prototype.toFrequency = function(){
			return 1/this.toSeconds();
		};

	/**
		 *  @class Emitter gives classes which extend it
		 *         the ability to listen for and emit events.
		 *         Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
		 *         MIT (c) 2011 Jerome Etienne.
		 *
		 *  @extends {Tone}
		 */
		var Emitter = function(){
			/**
			 *  Contains all of the events.
			 *  @private
			 *  @type  {Object}
			 */
			this._events = {};
		};

		Tone$1.extend(Emitter);

		/**
		 *  Bind a callback to a specific event.
		 *  @param  {String}    event     The name of the event to listen for.
		 *  @param  {Function}  callback  The callback to invoke when the
		 *                                event is emitted
		 *  @return  {Emitter}    this
		 */
		Emitter.prototype.on = function(event, callback){
			//split the event
			var events = event.split(/\W+/);
			for (var i = 0; i < events.length; i++){
				var eventName = events[i];
				if (!this._events.hasOwnProperty(eventName)){
					this._events[eventName] = [];
				}
				this._events[eventName].push(callback);
			}
			return this;
		};

		/**
		 *  Remove the event listener.
		 *  @param  {String}    event     The event to stop listening to.
		 *  @param  {Function=}  callback  The callback which was bound to
		 *                                the event with Emitter.on.
		 *                                If no callback is given, all callbacks
		 *                                events are removed.
		 *  @return  {Emitter}    this
		 */
		Emitter.prototype.off = function(event, callback){
			var events = event.split(/\W+/);
			for (var ev = 0; ev < events.length; ev++){
				event = events[ev];
				if (this._events.hasOwnProperty(event)){
					if (Tone$1.prototype.isUndef(callback)){
						this._events[event] = [];
					} else {
						var eventList = this._events[event];
						for (var i = 0; i < eventList.length; i++){
							if (eventList[i] === callback){
								eventList.splice(i, 1);
							}
						}
					}
				}
			}
			return this;
		};

		/**
		 *  Invoke all of the callbacks bound to the event
		 *  with any arguments passed in.
		 *  @param  {String}  event  The name of the event.
		 *  @param {*...} args The arguments to pass to the functions listening.
		 *  @return  {Emitter}  this
		 */
		Emitter.prototype.emit = function(event){
			if (this._events){
				var args = Array.prototype.slice.call(arguments, 1);
				if (this._events.hasOwnProperty(event)){
					var eventList = this._events[event];
					for (var i = 0, len = eventList.length; i < len; i++){
						eventList[i].apply(this, args);
					}
				}
			}
			return this;
		};

		/**
		 *  Add Emitter functions (on/off/emit) to the object
		 *  @param  {Object|Function}  object  The object or class to extend.
		 */
		Emitter.mixin = function(object){
			var functions = ["on", "off", "emit"];
			object._events = {};
			for (var i = 0; i < functions.length; i++){
				var func = functions[i];
				var emitterFunc = Emitter.prototype[func];
				object[func] = emitterFunc;
			}
		};

		/**
		 *  Clean up
		 *  @return  {Emitter}  this
		 */
		Emitter.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._events = null;
			return this;
		};

	/**
		 *  @class Wrapper around the native AudioContext.
		 *  @extends {Emitter}
		 *  @param {AudioContext=} context optionally pass in a context
		 */
		var Context$1 = function(context){

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

		Tone$1.extend(Context$1, Emitter);
		Emitter.mixin(Context$1);

		/**
		 *  Define a property on this Context.
		 *  This is used to extend the native AudioContext
		 *  @param  {AudioContext}  context
		 *  @param  {String}  prop
		 *  @private
		 */
		Context$1.prototype._defineProperty = function(context, prop){
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
		Context$1.prototype.now = function(){
			return this._context.currentTime;
		};

		/**
		 *  Generate a web worker
		 *  @return  {WebWorker}
		 *  @private
		 */
		Context$1.prototype._createWorker = function(){

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
		Context$1.prototype._createConstant = function(val){
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
		Object.defineProperty(Context$1.prototype, "lag", {
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
		Object.defineProperty(Context$1.prototype, "lookAhead", {
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
		Object.defineProperty(Context$1.prototype, "updateInterval", {
			get : function(){
				return this._updateInterval;
			},
			set : function(interval){
				this._updateInterval = Math.max(interval, Tone$1.prototype.blockTime);
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
		Object.defineProperty(Context$1.prototype, "latencyHint", {
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

			var isUndef = Tone$1.prototype.isUndef;
			var isFunction = Tone$1.prototype.isFunction;

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
		if (Tone$1.supported){
			shimAudioContext();
			Tone$1.context = new Context$1();
		} else {
			console.warn("This browser does not support js");
		}

	///////////////////////////////////////////////////////////////////////////
		//	TYPES
		///////////////////////////////////////////////////////////////////////////

		/**
		 * Units which a value can take on.
		 * @enum {String}
		 */
		const Type$1 = {
			/**
			 *  Default units
			 *  @typedef {Default}
			 */
			Default : "number",
			/**
			 *  Time can be described in a number of ways. Read more [Time](https://github.com/Tonejs/js/wiki/Time).
			 *
			 *  <ul>
			 *  <li>Numbers, which will be taken literally as the time (in seconds).</li>
			 *  <li>Notation, ("4n", "8t") describes time in BPM and time signature relative values.</li>
			 *  <li>TransportTime, ("4:3:2") will also provide tempo and time signature relative times
			 *  in the form BARS:QUARTERS:SIXTEENTHS.</li>
			 *  <li>Frequency, ("8hz") is converted to the length of the cycle in seconds.</li>
			 *  <li>Now-Relative, ("+1") prefix any of the above with "+" and it will be interpreted as
			 *  "the current time plus whatever expression follows".</li>
			 *  <li>Expressions, ("3:0 + 2 - (1m / 7)") any of the above can also be combined
			 *  into a mathematical expression which will be evaluated to compute the desired time.</li>
			 *  <li>No Argument, for methods which accept time, no argument will be interpreted as
			 *  "now" (i.e. the currentTime).</li>
			 *  </ul>
			 *
			 *  @typedef {Time}
			 */
			Time : "time",
			/**
			 *  Frequency can be described similar to time, except ultimately the
			 *  values are converted to frequency instead of seconds. A number
			 *  is taken literally as the value in hertz. Additionally any of the
			 *  Time encodings can be used. Note names in the form
			 *  of NOTE OCTAVE (i.e. C4) are also accepted and converted to their
			 *  frequency value.
			 *  @typedef {Frequency}
			 */
			Frequency : "frequency",
			/**
			 *  TransportTime describes a position along the Transport's timeline. It is
			 *  similar to Time in that it uses all the same encodings, but TransportTime specifically
			 *  pertains to the Transport's timeline, which is startable, stoppable, loopable, and seekable.
			 *  [Read more](https://github.com/Tonejs/js/wiki/TransportTime)
			 *  @typedef {TransportTime}
			 */
			TransportTime : "transportTime",
			/**
			 *  Ticks are the basic subunit of the Transport. They are
			 *  the smallest unit of time that the Transport supports.
			 *  @typedef {Ticks}
			 */
			Ticks : "ticks",
			/**
			 *  Normal values are within the range [0, 1].
			 *  @typedef {NormalRange}
			 */
			NormalRange : "normalRange",
			/**
			 *  AudioRange values are between [-1, 1].
			 *  @typedef {AudioRange}
			 */
			AudioRange : "audioRange",
			/**
			 *  Decibels are a logarithmic unit of measurement which is useful for volume
			 *  because of the logarithmic way that we perceive loudness. 0 decibels
			 *  means no change in volume. -10db is approximately half as loud and 10db
			 *  is twice is loud.
			 *  @typedef {Decibels}
			 */
			Decibels : "db",
			/**
			 *  Half-step note increments, i.e. 12 is an octave above the root. and 1 is a half-step up.
			 *  @typedef {Interval}
			 */
			Interval : "interval",
			/**
			 *  Beats per minute.
			 *  @typedef {BPM}
			 */
			BPM : "bpm",
			/**
			 *  The value must be greater than or equal to 0.
			 *  @typedef {Positive}
			 */
			Positive : "positive",
			/**
			 *  A cent is a hundredth of a semitone.
			 *  @typedef {Cents}
			 */
			Cents : "cents",
			/**
			 *  Angle between 0 and 360.
			 *  @typedef {Degrees}
			 */
			Degrees : "degrees",
			/**
			 *  A number representing a midi note.
			 *  @typedef {MIDI}
			 */
			MIDI : "midi",
			/**
			 *  A colon-separated representation of time in the form of
			 *  Bars:Beats:Sixteenths.
			 *  @typedef {BarsBeatsSixteenths}
			 */
			BarsBeatsSixteenths : "barsBeatsSixteenths",
			/**
			 *  Sampling is the reduction of a continuous signal to a discrete signal.
			 *  Audio is typically sampled 44100 times per second.
			 *  @typedef {Samples}
			 */
			Samples : "samples",
			/**
			 *  Hertz are a frequency representation defined as one cycle per second.
			 *  @typedef {Hertz}
			 */
			Hertz : "hertz",
			/**
			 *  A frequency represented by a letter name,
			 *  accidental and octave. This system is known as
			 *  [Scientific Pitch Notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation).
			 *  @typedef {Note}
			 */
			Note : "note",
			/**
			 *  One millisecond is a thousandth of a second.
			 *  @typedef {Milliseconds}
			 */
			Milliseconds : "milliseconds",
			/**
			 *  Seconds are the time unit of the AudioContext. In the end,
			 *  all values need to be evaluated to seconds.
			 *  @typedef {Seconds}
			 */
			Seconds : "seconds",
			/**
			 *  A string representing a duration relative to a measure.
			 *  <ul>
			 *  	<li>"4n" = quarter note</li>
			 *   	<li>"2m" = two measures</li>
			 *    	<li>"8t" = eighth-note triplet</li>
			 *  </ul>
			 *  @typedef {Notation}
			 */
			Notation : "notation",
		};

		///////////////////////////////////////////////////////////////////////////
		// AUGMENT TONE's Tone.PROTOTYPE
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Convert Time into seconds.
		 *
		 *  Unlike the method which it overrides, this takes into account
		 *  transporttime and musical notation.
		 *
		 *  Time : 1.40
		 *  Notation: 4n|1m|2t
		 *  Now Relative: +3n
		 *  Math: 3n+16n or even complicated expressions ((3n*2)/6 + 1)
		 *
		 *  @param  {Time} time
		 *  @return {Seconds}
		 */
		Tone$1.prototype.toSeconds = function(time){
			if (this.isNumber(time)){
				return time;
			} else if (this.isUndef(time)){
				return this.now();
			} else if (this.isString(time)){
				return (new Time$1(time)).toSeconds();
			} else if (time instanceof TimeBase){
				return time.toSeconds();
			}
		};

		/**
		 *  Convert a frequency representation into a number.
		 *  @param  {Frequency} freq
		 *  @return {Hertz}      the frequency in hertz
		 */
		Tone$1.prototype.toFrequency = function(freq){
			if (this.isNumber(freq)){
				return freq;
			} else if (this.isString(freq) || this.isUndef(freq)){
				return (new Frequency(freq)).eval();
			} else if (freq instanceof TimeBase){
				return freq.toFrequency();
			}
		};

		/**
		 *  Convert a time representation into ticks.
		 *  @param  {Time} time
		 *  @return {Ticks}  the time in ticks
		 */
		Tone$1.prototype.toTicks = function(time){
			if (this.isNumber(time) || this.isString(time)){
				return (new TransportTime$1(time)).toTicks();
			} else if (this.isUndef(time)){
				return Transport.ticks;
			} else if (time instanceof TimeBase){
				return time.toTicks();
			}
		};

	/**
		 *  @class Param wraps the native Web Audio's AudioParam to provide
		 *         additional unit conversion functionality. It also
		 *         serves as a base-class for classes which have a single,
		 *         automatable parameter.
		 *  @extends {Tone}
		 *  @param  {AudioParam}  param  The parameter to wrap.
		 *  @param  {Type} units The units of the audio param.
		 *  @param  {Boolean} convert If the param should be converted.
		 */
		var Param$1 = function(){

			var options = this.optionsObject(arguments, ["param", "units", "convert"], Param$1.defaults);

			/**
			 *  The native parameter to control
			 *  @type  {AudioParam}
			 *  @private
			 */
			this._param = this.input = options.param;

			/**
			 *  The units of the parameter
			 *  @type {Type}
			 */
			this.units = options.units;

			/**
			 *  If the value should be converted or not
			 *  @type {Boolean}
			 */
			this.convert = options.convert;

			/**
			 *  True if the signal value is being overridden by
			 *  a connected signal.
			 *  @readOnly
			 *  @type  {boolean}
			 *  @private
			 */
			this.overridden = false;

			/**
			 *  If there is an LFO, this is where it is held.
			 *  @type  {LFO}
			 *  @private
			 */
			this._lfo = null;

			if (this.isObject(options.lfo)){
				this.value = options.lfo;
			} else if (!this.isUndef(options.value)){
				this.value = options.value;
			}
		};

		Tone$1.extend(Param$1);

		/**
		 *  Defaults
		 *  @type  {Object}
		 *  @const
		 */
		Param$1.defaults = {
			"units" : Type$1.Default,
			"convert" : true,
			"param" : undefined
		};

		/**
		 * The current value of the parameter.
		 * @memberOf Param#
		 * @type {Number}
		 * @name value
		 */
		Object.defineProperty(Param$1.prototype, "value", {
			get : function(){
				return this._toUnits(this._param.value);
			},
			set : function(value){
				if (this.isObject(value)){
					//throw an error if the LFO needs to be included
					if (this.isUndef(LFO)){
						throw new Error("Include 'LFO' to use an LFO as a Param value.");
					}
					//remove the old one
					if (this._lfo){
						this._lfo.dispose();
					}
					this._lfo = new LFO(value).start();
					this._lfo.connect(this.input);
				} else {
					var convertedVal = this._fromUnits(value);
					this._param.cancelScheduledValues(0);
					this._param.value = convertedVal;
				}
			}
		});

		/**
		 *  Convert the given value from the type specified by Param.units
		 *  into the destination value (such as Gain or Frequency).
		 *  @private
		 *  @param  {*} val the value to convert
		 *  @return {number}     the number which the value should be set to
		 */
		Param$1.prototype._fromUnits = function(val){
			if (this.convert || this.isUndef(this.convert)){
				switch(this.units){
					case Type$1.Time:
						return this.toSeconds(val);
					case Type$1.Frequency:
						return this.toFrequency(val);
					case Type$1.Decibels:
						return this.dbToGain(val);
					case Type$1.NormalRange:
						return Math.min(Math.max(val, 0), 1);
					case Type$1.AudioRange:
						return Math.min(Math.max(val, -1), 1);
					case Type$1.Positive:
						return Math.max(val, 0);
					default:
						return val;
				}
			} else {
				return val;
			}
		};

		/**
		 * Convert the parameters value into the units specified by Param.units.
		 * @private
		 * @param  {number} val the value to convert
		 * @return {number}
		 */
		Param$1.prototype._toUnits = function(val){
			if (this.convert || this.isUndef(this.convert)){
				switch(this.units){
					case Type$1.Decibels:
						return this.gainToDb(val);
					default:
						return val;
				}
			} else {
				return val;
			}
		};

		/**
		 *  the minimum output value
		 *  @type {Number}
		 *  @private
		 */
		Param$1.prototype._minOutput = 0.00001;

		/**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {Param} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now.
		 * freq.setValueAtTime("G4", "+1");
		 */
		Param$1.prototype.setValueAtTime = function(value, time){
			value = this._fromUnits(value);
			time = this.toSeconds(time);
			if (time <= this.now() + this.blockTime){
				this._param.value = value;
			} else {
				this._param.setValueAtTime(value, time);
			}
			return this;
		};

		/**
		 *  Creates a schedule point with the current value at the current time.
		 *  This is useful for creating an automation anchor point in order to
		 *  schedule changes from the current value.
		 *
		 *  @param {number=} now (Optionally) pass the now value in.
		 *  @returns {Param} this
		 */
		Param$1.prototype.setRampPoint = function(now){
			now = this.defaultArg(now, this.now());
			var currentVal = this._param.value;
			// exponentialRampToValueAt cannot ever ramp from or to 0
			// More info: https://bugzilla.mozilla.org/show_bug.cgi?id=1125600#c2
			if (currentVal === 0){
				currentVal = this._minOutput;
			}
			this._param.setValueAtTime(currentVal, now);
			return this;
		};

		/**
		 *  Schedules a linear continuous change in parameter value from the
		 *  previous scheduled parameter value to the given value.
		 *
		 *  @param  {number} value
		 *  @param  {Time} endTime
		 *  @returns {Param} this
		 */
		Param$1.prototype.linearRampToValueAtTime = function(value, endTime){
			value = this._fromUnits(value);
			this._param.linearRampToValueAtTime(value, this.toSeconds(endTime));
			return this;
		};

		/**
		 *  Schedules an exponential continuous change in parameter value from
		 *  the previous scheduled parameter value to the given value.
		 *
		 *  @param  {number} value
		 *  @param  {Time} endTime
		 *  @returns {Param} this
		 */
		Param$1.prototype.exponentialRampToValueAtTime = function(value, endTime){
			value = this._fromUnits(value);
			value = Math.max(this._minOutput, value);
			this._param.exponentialRampToValueAtTime(value, this.toSeconds(endTime));
			return this;
		};

		/**
		 *  Schedules an exponential continuous change in parameter value from
		 *  the current time and current value to the given value over the
		 *  duration of the rampTime.
		 *
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the
		 *                               value to ramp from it's current value
		 *  @param {Time}	[startTime=now] 	When the ramp should start.
		 *  @returns {Param} this
		 *  @example
		 * //exponentially ramp to the value 2 over 4 seconds.
		 * signal.exponentialRampToValue(2, 4);
		 */
		Param$1.prototype.exponentialRampToValue = function(value, rampTime, startTime){
			startTime = this.toSeconds(startTime);
			this.setRampPoint(startTime);
			this.exponentialRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
			return this;
		};

		/**
		 *  Schedules an linear continuous change in parameter value from
		 *  the current time and current value to the given value over the
		 *  duration of the rampTime.
		 *
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the
		 *                               value to ramp from it's current value
		 *  @param {Time}	[startTime=now] 	When the ramp should start.
		 *  @returns {Param} this
		 *  @example
		 * //linearly ramp to the value 4 over 3 seconds.
		 * signal.linearRampToValue(4, 3);
		 */
		Param$1.prototype.linearRampToValue = function(value, rampTime, startTime){
			startTime = this.toSeconds(startTime);
			this.setRampPoint(startTime);
			this.linearRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
			return this;
		};

		/**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value
		 *  @param {Time} startTime
		 *  @param {number} timeConstant
		 *  @returns {Param} this
		 */
		Param$1.prototype.setTargetAtTime = function(value, startTime, timeConstant){
			value = this._fromUnits(value);
			// The value will never be able to approach without timeConstant > 0.
			// http://www.w3.org/TR/webaudio/#dfn-setTargetAtTime, where the equation
			// is described. 0 results in a division by 0.
			value = Math.max(this._minOutput, value);
			timeConstant = Math.max(this._minOutput, timeConstant);
			this._param.setTargetAtTime(value, this.toSeconds(startTime), timeConstant);
			return this;
		};

		/**
		 *  Sets an array of arbitrary parameter values starting at the given time
		 *  for the given duration.
		 *
		 *  @param {Array} values
		 *  @param {Time} startTime
		 *  @param {Time} duration
		 *  @returns {Param} this
		 */
		Param$1.prototype.setValueCurveAtTime = function(values, startTime, duration){
			for (var i = 0; i < values.length; i++){
				values[i] = this._fromUnits(values[i]);
			}
			this._param.setValueCurveAtTime(values, this.toSeconds(startTime), this.toSeconds(duration));
			return this;
		};

		/**
		 *  Cancels all scheduled parameter changes with times greater than or
		 *  equal to startTime.
		 *
		 *  @param  {Time} startTime
		 *  @returns {Param} this
		 */
		Param$1.prototype.cancelScheduledValues = function(startTime){
			this._param.cancelScheduledValues(this.toSeconds(startTime));
			return this;
		};

		/**
		 *  Ramps to the given value over the duration of the rampTime.
		 *  Automatically selects the best ramp type (exponential or linear)
		 *  depending on the `units` of the signal
		 *
		 *  @param  {number} value
		 *  @param  {Time} rampTime 	The time that it takes the
		 *                              value to ramp from it's current value
		 *  @param {Time}	[startTime=now] 	When the ramp should start.
		 *  @returns {Param} this
		 *  @example
		 * //ramp to the value either linearly or exponentially
		 * //depending on the "units" value of the signal
		 * signal.rampTo(0, 10);
		 *  @example
		 * //schedule it to ramp starting at a specific time
		 * signal.rampTo(0, 10, 5)
		 */
		Param$1.prototype.rampTo = function(value, rampTime, startTime){
			rampTime = this.defaultArg(rampTime, 0);
			if (this.units === Type$1.Frequency || this.units === Type$1.BPM){
				this.exponentialRampToValue(value, rampTime, startTime);
			} else {
				this.linearRampToValue(value, rampTime, startTime);
			}
			return this;
		};

		/**
		 *  The LFO created by the signal instance. If none
		 *  was created, this is null.
		 *  @type {LFO}
		 *  @readOnly
		 *  @memberOf Param#
		 *  @name lfo
		 */
		Object.defineProperty(Param$1.prototype, "lfo", {
			get : function(){
				return this._lfo;
			}
		});

		/**
		 *  Clean up
		 *  @returns {Param} this
		 */
		Param$1.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._param = null;
			if (this._lfo){
				this._lfo.dispose();
				this._lfo = null;
			}
			return this;
		};

	/**
		 *  @class A thin wrapper around the Native Web Audio GainNode.
		 *         The GainNode is a basic building block of the Web Audio
		 *         API and is useful for routing audio and adjusting gains.
		 *  @extends {Tone}
		 *  @param  {Number=}  gain  The initial gain of the GainNode
		 *  @param {Type=} units The units of the gain parameter.
		 */
		var Gain$1 = function(){

			var options = this.optionsObject(arguments, ["gain", "units"], Gain$1.defaults);

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
			this.gain = new Param$1({
				"param" : this._gainNode.gain,
				"units" : options.units,
				"value" : options.gain,
				"convert" : options.convert
			});
			this._readOnly("gain");
		};

		Tone$1.extend(Gain$1);

		/**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
		Gain$1.defaults = {
			"gain" : 1,
			"convert" : true,
		};

		/**
		 *  Clean up.
		 *  @return  {Gain}  this
		 */
		Gain$1.prototype.dispose = function(){
			Param$1.prototype.dispose.call(this);
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
		Tone$1.prototype.createInsOuts = function(inputs, outputs){

			if (inputs === 1){
				this.input = new Gain$1();
			} else if (inputs > 1){
				this.input = new Array(inputs);
			}

			if (outputs === 1){
				this.output = new Gain$1();
			} else if (outputs > 1){
				this.output = new Array(inputs);
			}
		};

		///////////////////////////////////////////////////////////////////////////

	/**
	 *  @class  Envelope is an [ADSR](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope)
	 *          envelope generator. Envelope outputs a signal which
	 *          can be connected to an AudioParam or Signal.
	 *          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/ADSR_parameter.svg">
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Time} [attack] The amount of time it takes for the envelope to go from
	 *                         0 to it's maximum value.
	 *  @param {Time} [decay]	The period of time after the attack that it takes for the envelope
	 *                       	to fall to the sustain value.
	 *  @param {NormalRange} [sustain]	The percent of the maximum value that the envelope rests at until
	 *                                	the release is triggered.
	 *  @param {Time} [release]	The amount of time after the release is triggered it takes to reach 0.
	 *  @example
	 * //an amplitude envelope
	 * var gainNode = context.createGain();
	 * var env = new Envelope({
	 * 	"attack" : 0.1,
	 * 	"decay" : 0.2,
	 * 	"sustain" : 1,
	 * 	"release" : 0.8,
	 * });
	 * env.connect(gainNode.gain);
	 */
	var Envelope$1 = function(){

		//get all of the defaults
		var options = this.optionsObject(arguments, ["attack", "decay", "sustain", "release"], Envelope$1.defaults);

		/**
		 *  When triggerAttack is called, the attack time is the amount of
		 *  time it takes for the envelope to reach it's maximum value.
		 *  @type {Time}
		 */
		this.attack = options.attack;

		/**
		 *  After the attack portion of the envelope, the value will fall
		 *  over the duration of the decay time to it's sustain value.
		 *  @type {Time}
		 */
		this.decay = options.decay;

		/**
		 * 	The sustain value is the value
		 * 	which the envelope rests at after triggerAttack is
		 * 	called, but before triggerRelease is invoked.
		 *  @type {NormalRange}
		 */
		this.sustain = options.sustain;

		/**
		 *  After triggerRelease is called, the envelope's
		 *  value will fall to it's miminum value over the
		 *  duration of the release time.
		 *  @type {Time}
		 */
		this.release = options.release;

		/**
		 *  the next time the envelope is at standby
		 *  @type {number}
		 *  @private
		 */
		this._attackCurve = "linear";

		/**
		 *  the next time the envelope is at standby
		 *  @type {number}
		 *  @private
		 */
		this._releaseCurve = "exponential";

		/**
		 *  the signal
		 *  @type {TimelineSignal}
		 *  @private
		 */
		this._sig = this.output = new TimelineSignal();
		this._sig.setValueAtTime(0, 0);

		//set the attackCurve initially
		this.attackCurve = options.attackCurve;
		this.releaseCurve = options.releaseCurve;
	};

	extend(Envelope$1);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 */
	Envelope$1.defaults = {
		"attack" : 0.01,
		"decay" : 0.1,
		"sustain" : 0.5,
		"release" : 1,
		"attackCurve" : "linear",
		"releaseCurve" : "exponential",
	};

	/**
	 * Read the current value of the envelope. Useful for
	 * syncronizing visual output to the envelope.
	 * @memberOf Envelope#
	 * @type {Number}
	 * @name value
	 * @readOnly
	 */
	Object.defineProperty(Envelope$1.prototype, "value", {
		get : function(){
			return this.getValueAtTime(this.now());
		}
	});

	/**
	 * The shape of the attack.
	 * Can be any of these strings:
	 * <ul>
	 *   <li>linear</li>
	 *   <li>exponential</li>
	 *   <li>sine</li>
	 *   <li>cosine</li>
	 *   <li>bounce</li>
	 *   <li>ripple</li>
	 *   <li>step</li>
	 * </ul>
	 * Can also be an array which describes the curve. Values
	 * in the array are evenly subdivided and linearly
	 * interpolated over the duration of the attack.
	 * @memberOf Envelope#
	 * @type {String|Array}
	 * @name attackCurve
	 * @example
	 * env.attackCurve = "linear";
	 * @example
	 * //can also be an array
	 * env.attackCurve = [0, 0.2, 0.3, 0.4, 1]
	 */
	Object.defineProperty(Envelope$1.prototype, "attackCurve", {
		get : function(){
			if (this.isString(this._attackCurve)){
				return this._attackCurve;
			} else if (this.isArray(this._attackCurve)){
				//look up the name in the curves array
				for (var type in Envelope$1.Type){
					if (Envelope$1.Type[type].In === this._attackCurve){
						return type;
					}
				}
				//otherwise just return the array
				return this._attackCurve;
			}
		},
		set : function(curve){
			//check if it's a valid type
			if (Envelope$1.Type.hasOwnProperty(curve)){
				var curveDef = Envelope$1.Type[curve];
				if (this.isObject(curveDef)){
					this._attackCurve = curveDef.In;
				} else {
					this._attackCurve = curveDef;
				}
			} else if (this.isArray(curve)){
				this._attackCurve = curve;
			} else {
				throw new Error("Envelope: invalid curve: " + curve);
			}
		}
	});

	/**
	 * The shape of the release. See the attack curve types.
	 * @memberOf Envelope#
	 * @type {String|Array}
	 * @name releaseCurve
	 * @example
	 * env.releaseCurve = "linear";
	 */
	Object.defineProperty(Envelope$1.prototype, "releaseCurve", {
		get : function(){
			if (this.isString(this._releaseCurve)){
				return this._releaseCurve;
			} else if (this.isArray(this._releaseCurve)){
				//look up the name in the curves array
				for (var type in Envelope$1.Type){
					if (Envelope$1.Type[type].Out === this._releaseCurve){
						return type;
					}
				}
				//otherwise just return the array
				return this._releaseCurve;
			}
		},
		set : function(curve){
			//check if it's a valid type
			if (Envelope$1.Type.hasOwnProperty(curve)){
				var curveDef = Envelope$1.Type[curve];
				if (this.isObject(curveDef)){
					this._releaseCurve = curveDef.Out;
				} else {
					this._releaseCurve = curveDef;
				}
			} else if (this.isArray(curve)){
				this._releaseCurve = curve;
			} else {
				throw new Error("Envelope: invalid curve: " + curve);
			}
		}
	});

	/**
	 *  Trigger the attack/decay portion of the ADSR envelope.
	 *  @param  {Time} [time=now] When the attack should start.
	 *  @param {NormalRange} [velocity=1] The velocity of the envelope scales the vales.
	 *                               number between 0-1
	 *  @returns {Envelope} this
	 *  @example
	 *  //trigger the attack 0.5 seconds from now with a velocity of 0.2
	 *  env.triggerAttack("+0.5", 0.2);
	 */
	Envelope$1.prototype.triggerAttack = function(time, velocity){
		time = this.toSeconds(time);
		var originalAttack = this.toSeconds(this.attack);
		var attack = originalAttack;
		var decay = this.toSeconds(this.decay);
		velocity = this.defaultArg(velocity, 1);
		//check if it's not a complete attack
		var currentValue = this.getValueAtTime(time);
		if (currentValue > 0){
			//subtract the current value from the attack time
			var attackRate = 1 / attack;
			var remainingDistance = 1 - currentValue;
			//the attack is now the remaining time
			attack = remainingDistance / attackRate;
		}
		//attack
		if (this._attackCurve === "linear"){
			this._sig.linearRampToValue(velocity, attack, time);
		} else if (this._attackCurve === "exponential"){
			this._sig.exponentialRampToValue(velocity, attack, time);
		} else if (attack > 0){
			this._sig.setRampPoint(time);
			var curve = this._attackCurve;
			//take only a portion of the curve
			if (attack < originalAttack){
				var percentComplete = 1 - attack / originalAttack;
				var sliceIndex = Math.floor(percentComplete * this._attackCurve.length);
				curve = this._attackCurve.slice(sliceIndex);
				//the first index is the current value
				curve[0] = currentValue;
			}
			this._sig.setValueCurveAtTime(curve, time, attack, velocity);
		}
		//decay
		this._sig.exponentialRampToValue(velocity * this.sustain, decay, attack + time);
		return this;
	};

	/**
	 *  Triggers the release of the envelope.
	 *  @param  {Time} [time=now] When the release portion of the envelope should start.
	 *  @returns {Envelope} this
	 *  @example
	 *  //trigger release immediately
	 *  env.triggerRelease();
	 */
	Envelope$1.prototype.triggerRelease = function(time){
		time = this.toSeconds(time);
		var currentValue = this.getValueAtTime(time);
		if (currentValue > 0){
			var release = this.toSeconds(this.release);
			if (this._releaseCurve === "linear"){
				this._sig.linearRampToValue(0, release, time);
			} else if (this._releaseCurve === "exponential"){
				this._sig.exponentialRampToValue(0, release, time);
			} else{
				var curve = this._releaseCurve;
				if (this.isArray(curve)){
					this._sig.setRampPoint(time);
					this._sig.setValueCurveAtTime(curve, time, release, currentValue);
				}
			}
		}
		return this;
	};

	/**
	 *  Get the scheduled value at the given time. This will
	 *  return the unconverted (raw) value.
	 *  @param  {Number}  time  The time in seconds.
	 *  @return  {Number}  The scheduled value at the given time.
	 */
	Envelope$1.prototype.getValueAtTime = function(time){
		return this._sig.getValueAtTime(time);
	};

	/**
	 *  triggerAttackRelease is shorthand for triggerAttack, then waiting
	 *  some duration, then triggerRelease.
	 *  @param {Time} duration The duration of the sustain.
	 *  @param {Time} [time=now] When the attack should be triggered.
	 *  @param {number} [velocity=1] The velocity of the envelope.
	 *  @returns {Envelope} this
	 *  @example
	 * //trigger the attack and then the release after 0.6 seconds.
	 * env.triggerAttackRelease(0.6);
	 */
	Envelope$1.prototype.triggerAttackRelease = function(duration, time, velocity) {
		time = this.toSeconds(time);
		this.triggerAttack(time, velocity);
		this.triggerRelease(time + this.toSeconds(duration));
		return this;
	};

	/**
	 *  Cancels all scheduled envelope changes after the given time.
	 *  @param  {Time} after
	 *  @returns {Envelope} this
	 */
	Envelope$1.prototype.cancel = function (after) {
		this._sig.cancelScheduledValues(after);
		return this;
	};

	/**
	 *  Borrows the connect method from Signal.
	 *  @function
	 *  @private
	 */
	Envelope$1.prototype.connect = Signal.prototype.connect;

		/**
		 *  Generate some complex envelope curves.
		 */
	(function _createCurves(){

		var curveLen = 128;

		var i, k;

		//cosine curve
		var cosineCurve = [];
		for (i = 0; i < curveLen; i++){
			cosineCurve[i] = Math.sin((i / (curveLen - 1)) * (Math.PI / 2));
		}

		//ripple curve
		var rippleCurve = [];
		var rippleCurveFreq = 6.4;
		for (i = 0; i < curveLen - 1; i++){
			k = (i / (curveLen - 1));
			var sineWave = Math.sin(k * (Math.PI  * 2) * rippleCurveFreq - Math.PI / 2) + 1;
			rippleCurve[i] = sineWave/10 + k * 0.83;
		}
		rippleCurve[curveLen - 1] = 1;

		//stairs curve
		var stairsCurve = [];
		var steps = 5;
		for (i = 0; i < curveLen; i++){
			stairsCurve[i] = Math.ceil((i / (curveLen - 1)) * steps) / steps;
		}

		//in-out easing curve
		var sineCurve = [];
		for (i = 0; i < curveLen; i++){
			k = i / (curveLen - 1);
			sineCurve[i] = 0.5 * (1 - Math.cos(Math.PI * k));
		}

		//a bounce curve
		var bounceCurve = [];
		for (i = 0; i < curveLen; i++){
			k = i / (curveLen - 1);
			var freq = Math.pow(k, 3) * 4 + 0.2;
			var val = Math.cos(freq * Math.PI * 2 * k);
			bounceCurve[i] = Math.abs(val * (1 - k));
		}

		/**
		 *  Invert a value curve to make it work for the release
		 *  @private
		 */
		function invertCurve(curve){
			var out = new Array(curve.length);
			for (var j = 0; j < curve.length; j++){
				out[j] = 1 - curve[j];
			}
			return out;
		}

		/**
		 *  reverse the curve
		 *  @private
		 */
		function reverseCurve(curve){
			return curve.slice(0).reverse();
		}

		/**
		 *  attack and release curve arrays
		 *  @type  {Object}
		 *  @private
		 */
	 	Envelope$1.Type = {
	 		"linear" : "linear",
	 		"exponential" : "exponential",
			"bounce" : {
				In : invertCurve(bounceCurve),
				Out : bounceCurve
			},
			"cosine" : {
				In : cosineCurve,
				Out : reverseCurve(cosineCurve)
			},
			"step" : {
				In : stairsCurve,
				Out : invertCurve(stairsCurve)
			},
			"ripple" : {
				In : rippleCurve,
				Out : invertCurve(rippleCurve)
			},
			"sine" : {
				In : sineCurve,
				Out : invertCurve(sineCurve)
			}
		};

	})();

	/**
	 *  Disconnect and dispose.
	 *  @returns {Envelope} this
	 */
	Envelope$1.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._sig.dispose();
		this._sig = null;
		this._attackCurve = null;
		this._releaseCurve = null;
		return this;
	};

	/**
	 *  @class  AmplitudeEnvelope is a Envelope connected to a gain node.
	 *          Unlike Envelope, which outputs the envelope's value, AmplitudeEnvelope accepts
	 *          an audio signal as the input and will apply the envelope to the amplitude
	 *          of the signal. Read more about ADSR Envelopes on [Wikipedia](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope).
	 *
	 *  @constructor
	 *  @extends {Envelope}
	 *  @param {Time|Object} [attack] The amount of time it takes for the envelope to go from
	 *                               0 to it's maximum value.
	 *  @param {Time} [decay]	The period of time after the attack that it takes for the envelope
	 *                       	to fall to the sustain value.
	 *  @param {NormalRange} [sustain]	The percent of the maximum value that the envelope rests at until
	 *                                	the release is triggered.
	 *  @param {Time} [release]	The amount of time after the release is triggered it takes to reach 0.
	 *  @example
	 * var ampEnv = new AmplitudeEnvelope({
	 * 	"attack": 0.1,
	 * 	"decay": 0.2,
	 * 	"sustain": 1.0,
	 * 	"release": 0.8
	 * }).toMaster();
	 * //create an oscillator and connect it
	 * var osc = new Oscillator().connect(ampEnv).start();
	 * //trigger the envelopes attack and release "8t" apart
	 * ampEnv.triggerAttackRelease("8t");
	 */

	var AmplitudeEnvelope$1 = function(){

		Envelope$1.apply(this, arguments);

		/**
		 *  the input node
		 *  @type {GainNode}
		 *  @private
		 */
		this.input = this.output = new Gain$1();

		this._sig.connect(this.output.gain);
	};

	extend(AmplitudeEnvelope$1, Envelope$1);

	/**
	 *  Clean up
	 *  @return  {AmplitudeEnvelope}  this
	 */
	AmplitudeEnvelope$1.prototype.dispose = function(){
		this.input.dispose();
		this.input = null;
		Envelope$1.prototype.dispose.call(this);
		return this;
	};

	/**
		 *  @class  Base class for all Signals. Used Internally.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 */
		var SignalBase$1 = function(){};

		Tone$1.extend(SignalBase$1);

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
		 */
		SignalBase$1.prototype.connect = function(node, outputNumber, inputNumber){
			//zero it out so that the signal can have full control
			if ((Signal && Signal === node.constructor) ||
					(Param && Param === node.constructor) ||
					(TimelineSignal && TimelineSignal === node.constructor)){
				//cancel changes
				node._param.cancelScheduledValues(0);
				//reset the value
				node._param.value = 0;
				//mark the value as overridden
				node.overridden = true;
			} else if (node instanceof AudioParam){
				node.cancelScheduledValues(0);
				node.value = 0;
			}
			Tone$1.prototype.connect.call(this, node, outputNumber, inputNumber);
			return this;
		};

	/**
		 *  @class Wraps the native Web Audio API
		 *         [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
		 *
		 *  @extends {SignalBase}
		 *  @constructor
		 *  @param {function|Array|Number} mapping The function used to define the values.
		 *                                    The mapping function should take two arguments:
		 *                                    the first is the value at the current position
		 *                                    and the second is the array position.
		 *                                    If the argument is an array, that array will be
		 *                                    set as the wave shaping function. The input
		 *                                    signal is an AudioRange [-1, 1] value and the output
		 *                                    signal can take on any numerical values.
		 *
		 *  @param {Number} [bufferLen=1024] The length of the WaveShaperNode buffer.
		 *  @example
		 * var timesTwo = new WaveShaper(function(val){
		 * 	return val * 2;
		 * }, 2048);
		 *  @example
		 * //a waveshaper can also be constructed with an array of values
		 * var invert = new WaveShaper([1, -1]);
		 */
		var WaveShaper = function(mapping, bufferLen){

			/**
			 *  the waveshaper
			 *  @type {WaveShaperNode}
			 *  @private
			 */
			this._shaper = this.input = this.output = this.context.createWaveShaper();

			/**
			 *  the waveshapers curve
			 *  @type {Float32Array}
			 *  @private
			 */
			this._curve = null;

			if (Array.isArray(mapping)){
				this.curve = mapping;
			} else if (isFinite(mapping) || this.isUndef(mapping)){
				this._curve = new Float32Array(this.defaultArg(mapping, 1024));
			} else if (this.isFunction(mapping)){
				this._curve = new Float32Array(this.defaultArg(bufferLen, 1024));
				this.setMap(mapping);
			}
		};

		Tone$1.extend(WaveShaper, SignalBase$1);

		/**
		 *  Uses a mapping function to set the value of the curve.
		 *  @param {function} mapping The function used to define the values.
		 *                            The mapping function take two arguments:
		 *                            the first is the value at the current position
		 *                            which goes from -1 to 1 over the number of elements
		 *                            in the curve array. The second argument is the array position.
		 *  @returns {WaveShaper} this
		 *  @example
		 * //map the input signal from [-1, 1] to [0, 10]
		 * shaper.setMap(function(val, index){
		 * 	return (val + 1) * 5;
		 * })
		 */
		WaveShaper.prototype.setMap = function(mapping){
			for (var i = 0, len = this._curve.length; i < len; i++){
				var normalized = (i / (len - 1)) * 2 - 1;
				this._curve[i] = mapping(normalized, i);
			}
			this._shaper.curve = this._curve;
			return this;
		};

		/**
		 * The array to set as the waveshaper curve. For linear curves
		 * array length does not make much difference, but for complex curves
		 * longer arrays will provide smoother interpolation.
		 * @memberOf WaveShaper#
		 * @type {Array}
		 * @name curve
		 */
		Object.defineProperty(WaveShaper.prototype, "curve", {
			get : function(){
				return this._shaper.curve;
			},
			set : function(mapping){
				this._curve = new Float32Array(mapping);
				this._shaper.curve = this._curve;
			}
		});

		/**
		 * Specifies what type of oversampling (if any) should be used when
		 * applying the shaping curve. Can either be "none", "2x" or "4x".
		 * @memberOf WaveShaper#
		 * @type {string}
		 * @name oversample
		 */
		Object.defineProperty(WaveShaper.prototype, "oversample", {
			get : function(){
				return this._shaper.oversample;
			},
			set : function(oversampling){
				if (["none", "2x", "4x"].indexOf(oversampling) !== -1){
					this._shaper.oversample = oversampling;
				} else {
					throw new RangeError("WaveShaper: oversampling must be either 'none', '2x', or '4x'");
				}
			}
		});

		/**
		 *  Clean up.
		 *  @returns {WaveShaper} this
		 */
		WaveShaper.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._shaper.disconnect();
			this._shaper = null;
			this._curve = null;
			return this;
		};

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
		var Signal$1 = function(){

			var options = this.optionsObject(arguments, ["value", "units"], Signal$1.defaults);

			/**
			 * The node where the constant signal value is scaled.
			 * @type {GainNode}
			 * @private
			 */
			this.output = this._gain = this.context.createGain();

			options.param = this._gain.gain;
			Param$1.call(this, options);

			/**
			 * The node where the value is set.
			 * @type {Param}
			 * @private
			 */
			this.input = this._param = this._gain.gain;

			//connect the const output to the node output
			this.context._ones.chain(this._gain);
		};

		Tone$1.extend(Signal$1, Param$1);

		/**
		 *  The default values
		 *  @type  {Object}
		 *  @static
		 *  @const
		 */
		Signal$1.defaults = {
			"value" : 0,
			"units" : Type$1.Default,
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
		Signal$1.prototype.connect = SignalBase.prototype.connect;

		/**
		 *  dispose and disconnect
		 *  @returns {Signal} this
		 */
		Signal$1.prototype.dispose = function(){
			Param$1.prototype.dispose.call(this);
			this._param = null;
			this._gain.disconnect();
			this._gain = null;
			return this;
		};

	/**
		 *  @class A Timeline class for scheduling and maintaining state
		 *         along a timeline. All events must have a "time" property.
		 *         Internally, events are stored in time order for fast
		 *         retrieval.
		 *  @extends {Tone}
		 *  @param {Positive} [memory=Infinity] The number of previous events that are retained.
		 */
		var Timeline = function(){

			var options = this.optionsObject(arguments, ["memory"], Timeline.defaults);

			/**
			 *  The array of scheduled timeline events
			 *  @type  {Array}
			 *  @private
			 */
			this._timeline = [];

			/**
			 *  An array of items to remove from the list.
			 *  @type {Array}
			 *  @private
			 */
			this._toRemove = [];

			/**
			 *  Flag if the tieline is mid iteration
			 *  @private
			 *  @type {Boolean}
			 */
			this._iterating = false;

			/**
			 *  The memory of the timeline, i.e.
			 *  how many events in the past it will retain
			 *  @type {Positive}
			 */
			this.memory = options.memory;
		};

		Tone$1.extend(Timeline);

		/**
		 *  the default parameters
		 *  @static
		 *  @const
		 */
		Timeline.defaults = {
			"memory" : Infinity
		};

		/**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf Timeline#
		 *  @name length
		 *  @readOnly
		 */
		Object.defineProperty(Timeline.prototype, "length", {
			get : function(){
				return this._timeline.length;
			}
		});

		/**
		 *  Insert an event object onto the timeline. Events must have a "time" attribute.
		 *  @param  {Object}  event  The event object to insert into the
		 *                           timeline.
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.add = function(event){
			//the event needs to have a time attribute
			if (this.isUndef(event.time)){
				throw new Error("Timeline: events must have a time attribute");
			}
			if (this._timeline.length){
				var index = this._search(event.time);
				this._timeline.splice(index + 1, 0, event);
			} else {
				this._timeline.push(event);
			}
			//if the length is more than the memory, remove the previous ones
			if (this.length > this.memory){
				var diff = this.length - this.memory;
				this._timeline.splice(0, diff);
			}
			return this;
		};

		/**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event object to remove from the list.
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.remove = function(event){
			if (this._iterating){
				this._toRemove.push(event);
			} else {
				var index = this._timeline.indexOf(event);
				if (index !== -1){
					this._timeline.splice(index, 1);
				}
			}
			return this;
		};

		/**
		 *  Get the nearest event whose time is less than or equal to the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object set after that time.
		 */
		Timeline.prototype.get = function(time){
			var index = this._search(time);
			if (index !== -1){
				return this._timeline[index];
			} else {
				return null;
			}
		};

		/**
		 *  Return the first event in the timeline without removing it
		 *  @returns {Object} The first event object
		 */
		Timeline.prototype.peek = function(){
			return this._timeline[0];
		};

		/**
		 *  Return the first event in the timeline and remove it
		 *  @returns {Object} The first event object
		 */
		Timeline.prototype.shift = function(){
			return this._timeline.shift();
		};

		/**
		 *  Get the event which is scheduled after the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object after the given time
		 */
		Timeline.prototype.getAfter = function(time){
			var index = this._search(time);
			if (index + 1 < this._timeline.length){
				return this._timeline[index + 1];
			} else {
				return null;
			}
		};

		/**
		 *  Get the event before the event at the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object before the given time
		 */
		Timeline.prototype.getBefore = function(time){
			var len = this._timeline.length;
			//if it's after the last item, return the last item
			if (len > 0 && this._timeline[len - 1].time < time){
				return this._timeline[len - 1];
			}
			var index = this._search(time);
			if (index - 1 >= 0){
				return this._timeline[index - 1];
			} else {
				return null;
			}
		};

		/**
		 *  Cancel events after the given time
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.cancel = function(after){
			if (this._timeline.length > 1){
				var index = this._search(after);
				if (index >= 0){
					if (this._timeline[index].time === after){
						//get the first item with that time
						for (var i = index; i >= 0; i--){
							if (this._timeline[i].time === after){
								index = i;
							} else {
								break;
							}
						}
						this._timeline = this._timeline.slice(0, index);
					} else {
						this._timeline = this._timeline.slice(0, index + 1);
					}
				} else {
					this._timeline = [];
				}
			} else if (this._timeline.length === 1){
				//the first item's time
				if (this._timeline[0].time >= after){
					this._timeline = [];
				}
			}
			return this;
		};

		/**
		 *  Cancel events before or equal to the given time.
		 *  @param  {Number}  time  The time to cancel before.
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.cancelBefore = function(time){
			if (this._timeline.length){
				var index = this._search(time);
				if (index >= 0){
					this._timeline = this._timeline.slice(index + 1);
				}
			}
			return this;
		};

		/**
		 *  Does a binary serach on the timeline array and returns the
		 *  nearest event index whose time is after or equal to the given time.
		 *  If a time is searched before the first index in the timeline, -1 is returned.
		 *  If the time is after the end, the index of the last item is returned.
		 *  @param  {Number}  time
		 *  @return  {Number} the index in the timeline array
		 *  @private
		 */
		Timeline.prototype._search = function(time){
			var beginning = 0;
			var len = this._timeline.length;
			var end = len;
			if (len > 0 && this._timeline[len - 1].time <= time){
				return len - 1;
			}
			while (beginning < end){
				// calculate the midpoint for roughly equal partition
				var midPoint = Math.floor(beginning + (end - beginning) / 2);
				var event = this._timeline[midPoint];
				var nextEvent = this._timeline[midPoint + 1];
				if (event.time === time){
					//choose the last one that has the same time
					for (var i = midPoint; i < this._timeline.length; i++){
						var testEvent = this._timeline[i];
						if (testEvent.time === time){
							midPoint = i;
						}
					}
					return midPoint;
				} else if (event.time < time && nextEvent.time > time){
					return midPoint;
				} else if (event.time > time){
					//search lower
					end = midPoint;
				} else if (event.time < time){
					//search upper
					beginning = midPoint + 1;
				}
			}
			return -1;
		};

		/**
		 *  Internal iterator. Applies extra safety checks for
		 *  removing items from the array.
		 *  @param  {Function}  callback
		 *  @param  {Number=}    lowerBound
		 *  @param  {Number=}    upperBound
		 *  @private
		 */
		Timeline.prototype._iterate = function(callback, lowerBound, upperBound){
			this._iterating = true;
			lowerBound = this.defaultArg(lowerBound, 0);
			upperBound = this.defaultArg(upperBound, this._timeline.length - 1);
			for (var i = lowerBound; i <= upperBound; i++){
				callback(this._timeline[i]);
			}
			this._iterating = false;
			if (this._toRemove.length > 0){
				for (var j = 0; j < this._toRemove.length; j++){
					var index = this._timeline.indexOf(this._toRemove[j]);
					if (index !== -1){
						this._timeline.splice(index, 1);
					}
				}
				this._toRemove = [];
			}
		};

		/**
		 *  Iterate over everything in the array
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.forEach = function(callback){
			this._iterate(callback);
			return this;
		};

		/**
		 *  Iterate over everything in the array at or before the given time.
		 *  @param  {Number}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.forEachBefore = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			var upperBound = this._search(time);
			if (upperBound !== -1){
				this._iterate(callback, 0, upperBound);
			}
			return this;
		};

		/**
		 *  Iterate over everything in the array after the given time.
		 *  @param  {Number}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.forEachAfter = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			var lowerBound = this._search(time);
			this._iterate(callback, lowerBound + 1);
			return this;
		};

		/**
		 *  Iterate over everything in the array at or after the given time. Similar to
		 *  forEachAfter, but includes the item(s) at the given time.
		 *  @param  {Number}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.forEachFrom = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			var lowerBound = this._search(time);
			//work backwards until the event time is less than time
			while (lowerBound >= 0 && this._timeline[lowerBound].time >= time){
				lowerBound--;
			}
			this._iterate(callback, lowerBound + 1);
			return this;
		};

		/**
		 *  Iterate over everything in the array at the given time
		 *  @param  {Number}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Timeline} this
		 */
		Timeline.prototype.forEachAtTime = function(time, callback){
			//iterate over the items in reverse so that removing an item doesn't break things
			var upperBound = this._search(time);
			if (upperBound !== -1){
				this._iterate(function(event){
					if (event.time === time){
						callback(event);
					}
				}, 0, upperBound);
			}
			return this;
		};

		/**
		 *  Clean up.
		 *  @return  {Timeline}  this
		 */
		Timeline.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._timeline = null;
			this._toRemove = null;
		};

	/**
		 *  @class A signal which adds the method getValueAtTime.
		 *         Code and inspiration from https://github.com/jsantell/web-audio-automation-timeline
		 *  @extends {Param}
		 *  @param {Number=} value The initial value of the signal
		 *  @param {String=} units The conversion units of the signal.
		 */
		var TimelineSignal$1 = function(){

			var options = this.optionsObject(arguments, ["value", "units"], Signal$1.defaults);

			/**
			 *  The scheduled events
			 *  @type {Timeline}
			 *  @private
			 */
			this._events = new Timeline(10);

			//constructors
			Signal$1.apply(this, options);
			options.param = this._param;
			Param.call(this, options);

			/**
			 *  The initial scheduled value
			 *  @type {Number}
			 *  @private
			 */
			this._initial = this._fromUnits(this._param.value);
		};

		Tone$1.extend(TimelineSignal$1, Param);

		/**
		 *  The event types of a schedulable signal.
		 *  @enum {String}
		 *  @private
		 */
		TimelineSignal$1.Type = {
			Linear : "linear",
			Exponential : "exponential",
			Target : "target",
			Curve : "curve",
			Set : "set"
		};

		/**
		 * The current value of the signal.
		 * @memberOf TimelineSignal#
		 * @type {Number}
		 * @name value
		 */
		Object.defineProperty(TimelineSignal$1.prototype, "value", {
			get : function(){
				var now = this.now();
				var val = this.getValueAtTime(now);
				return this._toUnits(val);
			},
			set : function(value){
				var convertedVal = this._fromUnits(value);
				this._initial = convertedVal;
				this.cancelScheduledValues();
				this._param.value = convertedVal;
			}
		});

		///////////////////////////////////////////////////////////////////////////
		//	SCHEDULING
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {TimelineSignal} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now.
		 * freq.setValueAtTime("G4", "+1");
		 */
		TimelineSignal$1.prototype.setValueAtTime = function (value, startTime) {
			value = this._fromUnits(value);
			startTime = this.toSeconds(startTime);
			this._events.add({
				"type" : TimelineSignal$1.Type.Set,
				"value" : value,
				"time" : startTime
			});
			//invoke the original event
			this._param.setValueAtTime(value, startTime);
			return this;
		};

		/**
		 *  Schedules a linear continuous change in parameter value from the
		 *  previous scheduled parameter value to the given value.
		 *
		 *  @param  {number} value
		 *  @param  {Time} endTime
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.linearRampToValueAtTime = function (value, endTime) {
			value = this._fromUnits(value);
			endTime = this.toSeconds(endTime);
			this._events.add({
				"type" : TimelineSignal$1.Type.Linear,
				"value" : value,
				"time" : endTime
			});
			this._param.linearRampToValueAtTime(value, endTime);
			return this;
		};

		/**
		 *  Schedules an exponential continuous change in parameter value from
		 *  the previous scheduled parameter value to the given value.
		 *
		 *  @param  {number} value
		 *  @param  {Time} endTime
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.exponentialRampToValueAtTime = function (value, endTime) {
			//get the previous event and make sure it's not starting from 0
			endTime = this.toSeconds(endTime);
			var beforeEvent = this._searchBefore(endTime);
			if (beforeEvent && beforeEvent.value === 0){
				//reschedule that event
				this.setValueAtTime(this._minOutput, beforeEvent.time);
			}
			value = this._fromUnits(value);
			var setValue = Math.max(value, this._minOutput);
			this._events.add({
				"type" : TimelineSignal$1.Type.Exponential,
				"value" : setValue,
				"time" : endTime
			});
			//if the ramped to value is 0, make it go to the min output, and then set to 0.
			if (value < this._minOutput){
				this._param.exponentialRampToValueAtTime(this._minOutput, endTime - this.sampleTime);
				this.setValueAtTime(0, endTime);
			} else {
				this._param.exponentialRampToValueAtTime(value, endTime);
			}
			return this;
		};

		/**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value
		 *  @param {Time} startTime
		 *  @param {number} timeConstant
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.setTargetAtTime = function (value, startTime, timeConstant) {
			value = this._fromUnits(value);
			value = Math.max(this._minOutput, value);
			timeConstant = Math.max(this._minOutput, timeConstant);
			startTime = this.toSeconds(startTime);
			this._events.add({
				"type" : TimelineSignal$1.Type.Target,
				"value" : value,
				"time" : startTime,
				"constant" : timeConstant
			});
			this._param.setTargetAtTime(value, startTime, timeConstant);
			return this;
		};

		/**
		 *  Set an array of arbitrary values starting at the given time for the given duration.
		 *  @param {Float32Array} values
		 *  @param {Time} startTime
		 *  @param {Time} duration
		 *  @param {NormalRange} [scaling=1] If the values in the curve should be scaled by some value
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.setValueCurveAtTime = function (values, startTime, duration, scaling) {
			scaling = this.defaultArg(scaling, 1);
			//copy the array
			var floats = new Array(values.length);
			for (var i = 0; i < floats.length; i++){
				floats[i] = this._fromUnits(values[i]) * scaling;
			}
			startTime = this.toSeconds(startTime);
			duration = this.toSeconds(duration);
			this._events.add({
				"type" : TimelineSignal$1.Type.Curve,
				"value" : floats,
				"time" : startTime,
				"duration" : duration
			});
			//set the first value
			this._param.setValueAtTime(floats[0], startTime);
			//schedule a lienar ramp for each of the segments
			for (var j = 1; j < floats.length; j++){
				var segmentTime = startTime + (j / (floats.length - 1) * duration);
				this._param.linearRampToValueAtTime(floats[j], segmentTime);
			}
			return this;
		};

		/**
		 *  Cancels all scheduled parameter changes with times greater than or
		 *  equal to startTime.
		 *
		 *  @param  {Time} startTime
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.cancelScheduledValues = function (after) {
			after = this.toSeconds(after);
			this._events.cancel(after);
			this._param.cancelScheduledValues(after);
			return this;
		};

		/**
		 *  Sets the computed value at the given time. This provides
		 *  a point from which a linear or exponential curve
		 *  can be scheduled after. Will cancel events after
		 *  the given time and shorten the currently scheduled
		 *  linear or exponential ramp so that it ends at `time` .
		 *  This is to avoid discontinuities and clicks in envelopes.
		 *  @param {Time} time When to set the ramp point
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.setRampPoint = function (time) {
			time = this.toSeconds(time);
			//get the value at the given time
			var val = this._toUnits(this.getValueAtTime(time));
			//if there is an event at the given time
			//and that even is not a "set"
			var before = this._searchBefore(time);
			if (before && before.time === time){
				//remove everything after
				this.cancelScheduledValues(time + this.sampleTime);
			} else if (before &&
					   before.type === TimelineSignal$1.Type.Curve &&
					   before.time + before.duration > time){
				//if the curve is still playing
				//cancel the curve
				this.cancelScheduledValues(time);
				this.linearRampToValueAtTime(val, time);
			} else {
				//reschedule the next event to end at the given time
				var after = this._searchAfter(time);
				if (after){
					//cancel the next event(s)
					this.cancelScheduledValues(time);
					if (after.type === TimelineSignal$1.Type.Linear){
						this.linearRampToValueAtTime(val, time);
					} else if (after.type === TimelineSignal$1.Type.Exponential){
						this.exponentialRampToValueAtTime(val, time);
					}
				}
				this.setValueAtTime(val, time);
			}
			return this;
		};

		/**
		 *  Do a linear ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the linear ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.linearRampToValueBetween = function (value, start, finish) {
			this.setRampPoint(start);
			this.linearRampToValueAtTime(value, finish);
			return this;
		};

		/**
		 *  Do a exponential ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the exponential ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 *  @returns {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.exponentialRampToValueBetween = function (value, start, finish) {
			this.setRampPoint(start);
			this.exponentialRampToValueAtTime(value, finish);
			return this;
		};

		///////////////////////////////////////////////////////////////////////////
		//	GETTING SCHEDULED VALUES
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Returns the value before or equal to the given time
		 *  @param  {Number}  time  The time to query
		 *  @return  {Object}  The event at or before the given time.
		 *  @private
		 */
		TimelineSignal$1.prototype._searchBefore = function(time){
			return this._events.get(time);
		};

		/**
		 *  The event after the given time
		 *  @param  {Number}  time  The time to query.
		 *  @return  {Object}  The next event after the given time
		 *  @private
		 */
		TimelineSignal$1.prototype._searchAfter = function(time){
			return this._events.getAfter(time);
		};

		/**
		 *  Get the scheduled value at the given time. This will
		 *  return the unconverted (raw) value.
		 *  @param  {Number}  time  The time in seconds.
		 *  @return  {Number}  The scheduled value at the given time.
		 */
		TimelineSignal$1.prototype.getValueAtTime = function(time){
			time = this.toSeconds(time);
			var after = this._searchAfter(time);
			var before = this._searchBefore(time);
			var value = this._initial;
			//if it was set by
			if (before === null){
				value = this._initial;
			} else if (before.type === TimelineSignal$1.Type.Target){
				var previous = this._events.getBefore(before.time);
				var previouVal;
				if (previous === null){
					previouVal = this._initial;
				} else {
					previouVal = previous.value;
				}
				value = this._exponentialApproach(before.time, previouVal, before.value, before.constant, time);
			} else if (before.type === TimelineSignal$1.Type.Curve){
				value = this._curveInterpolate(before.time, before.value, before.duration, time);
			} else if (after === null){
				value = before.value;
			} else if (after.type === TimelineSignal$1.Type.Linear){
				value = this._linearInterpolate(before.time, before.value, after.time, after.value, time);
			} else if (after.type === TimelineSignal$1.Type.Exponential){
				value = this._exponentialInterpolate(before.time, before.value, after.time, after.value, time);
			} else {
				value = before.value;
			}
			return value;
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
		 *  @returns {TimelineSignal} this
		 *  @method
		 */
		TimelineSignal$1.prototype.connect = SignalBase.prototype.connect;


		///////////////////////////////////////////////////////////////////////////
		//	AUTOMATION CURVE CALCULATIONS
		//	MIT License, copyright (c) 2014 Jordan Santell
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Calculates the the value along the curve produced by setTargetAtTime
		 *  @private
		 */
		TimelineSignal$1.prototype._exponentialApproach = function (t0, v0, v1, timeConstant, t) {
			return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
		};

		/**
		 *  Calculates the the value along the curve produced by linearRampToValueAtTime
		 *  @private
		 */
		TimelineSignal$1.prototype._linearInterpolate = function (t0, v0, t1, v1, t) {
			return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
		};

		/**
		 *  Calculates the the value along the curve produced by exponentialRampToValueAtTime
		 *  @private
		 */
		TimelineSignal$1.prototype._exponentialInterpolate = function (t0, v0, t1, v1, t) {
			v0 = Math.max(this._minOutput, v0);
			return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
		};

		/**
		 *  Calculates the the value along the curve produced by setValueCurveAtTime
		 *  @private
		 */
		TimelineSignal$1.prototype._curveInterpolate = function (start, curve, duration, time) {
			var len = curve.length;
			// If time is after duration, return the last curve value
			if (time >= start + duration) {
				return curve[len - 1];
			} else if (time <= start){
				return curve[0];
			} else {
				var progress = (time - start) / duration;
				var lowerIndex = Math.floor((len - 1) * progress);
				var upperIndex = Math.ceil((len - 1) * progress);
				var lowerVal = curve[lowerIndex];
				var upperVal = curve[upperIndex];
				if (upperIndex === lowerIndex){
					return lowerVal;
				} else {
					return this._linearInterpolate(lowerIndex, lowerVal, upperIndex, upperVal, progress * (len - 1));
				}
			}
		};

		/**
		 *  Clean up.
		 *  @return {TimelineSignal} this
		 */
		TimelineSignal$1.prototype.dispose = function(){
			Signal$1.prototype.dispose.call(this);
			Param.prototype.dispose.call(this);
			this._events.dispose();
			this._events = null;
		};

	/**
		 *  @class  A Timeline State. Provides the methods: <code>setStateAtTime("state", time)</code>
		 *          and <code>getValueAtTime(time)</code>.
		 *
		 *  @extends {Timeline}
		 *  @param {String} initial The initial state of the TimelineState.
		 *                          Defaults to <code>undefined</code>
		 */
		var TimelineState = function(initial){

			Timeline.call(this);

			/**
			 *  The initial state
			 *  @private
			 *  @type {String}
			 */
			this._initial = initial;
		};

		Tone$1.extend(TimelineState, Timeline);

		/**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 */
		TimelineState.prototype.getValueAtTime = function(time){
			var event = this.get(time);
			if (event !== null){
				return event.state;
			} else {
				return this._initial;
			}
		};

		/**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {String}  state The name of the state to set.
		 *  @param  {Number}  time  The time to query.
		 */
		TimelineState.prototype.setStateAtTime = function(state, time){
			this.add({
				"state" : state,
				"time" : time
			});
		};

	/**
		 *  @class  A sample accurate clock which provides a callback at the given rate.
		 *          While the callback is not sample-accurate (it is still susceptible to
		 *          loose JS timing), the time passed in as the argument to the callback
		 *          is precise. For most applications, it is better to use Transport
		 *          instead of the Clock by itself since you can synchronize multiple callbacks.
		 *
		 * 	@constructor
		 *  @extends {Emitter}
		 * 	@param {function} callback The callback to be invoked with the time of the audio event
		 * 	@param {Frequency} frequency The rate of the callback
		 * 	@example
		 * //the callback will be invoked approximately once a second
		 * //and will print the time exactly once a second apart.
		 * var clock = new Clock(function(time){
		 * 	console.log(time);
		 * }, 1);
		 */
		var Clock = function(){

			Emitter.call(this);

			var options = this.optionsObject(arguments, ["callback", "frequency"], Clock.defaults);

			/**
			 *  The callback function to invoke at the scheduled tick.
			 *  @type  {Function}
			 */
			this.callback = options.callback;

			/**
			 *  The next time the callback is scheduled.
			 *  @type {Number}
			 *  @private
			 */
			this._nextTick = 0;

			/**
			 *  The last state of the clock.
			 *  @type  {State}
			 *  @private
			 */
			this._lastState = State.Stopped;

			/**
			 *  The rate the callback function should be invoked.
			 *  @type  {BPM}
			 *  @signal
			 */
			this.frequency = new TimelineSignal$1(options.frequency, Type.Frequency);
			this._readOnly("frequency");

			/**
			 *  The number of times the callback was invoked. Starts counting at 0
			 *  and increments after the callback was invoked.
			 *  @type {Ticks}
			 *  @readOnly
			 */
			this.ticks = 0;

			/**
			 *  The state timeline
			 *  @type {TimelineState}
			 *  @private
			 */
			this._state = new TimelineState(State.Stopped);

			/**
			 *  The loop function bound to its context.
			 *  This is necessary to remove the event in the end.
			 *  @type {Function}
			 *  @private
			 */
			this._boundLoop = this._loop.bind(this);

			//bind a callback to the worker thread
	    	this.context.on("tick", this._boundLoop);
		};

		Tone$1.extend(Clock, Emitter);

		/**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
		Clock.defaults = {
			"callback" : Tone$1.noOp,
			"frequency" : 1,
			"lookAhead" : "auto",
		};

		/**
		 *  Returns the playback state of the source, either "started", "stopped" or "paused".
		 *  @type {State}
		 *  @readOnly
		 *  @memberOf Clock#
		 *  @name state
		 */
		Object.defineProperty(Clock.prototype, "state", {
			get : function(){
				return this._state.getValueAtTime(this.now());
			}
		});

		/**
		 *  Start the clock at the given time. Optionally pass in an offset
		 *  of where to start the tick counter from.
		 *  @param  {Time}  time    The time the clock should start
		 *  @param  {Ticks=}  offset  Where the tick counter starts counting from.
		 *  @return  {Clock}  this
		 */
		Clock.prototype.start = function(time, offset){
			time = this.toSeconds(time);
			if (this._state.getValueAtTime(time) !== State.Started){
				this._state.add({
					"state" : State.Started,
					"time" : time,
					"offset" : offset
				});
			}
			return this;
		};

		/**
		 *  Stop the clock. Stopping the clock resets the tick counter to 0.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Clock} this
		 *  @example
		 * clock.stop();
		 */
		Clock.prototype.stop = function(time){
			time = this.toSeconds(time);
			this._state.cancel(time);
			this._state.setStateAtTime(State.Stopped, time);
			return this;
		};


		/**
		 *  Pause the clock. Pausing does not reset the tick counter.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Clock} this
		 */
		Clock.prototype.pause = function(time){
			time = this.toSeconds(time);
			if (this._state.getValueAtTime(time) === State.Started){
				this._state.setStateAtTime(State.Paused, time);
			}
			return this;
		};

		/**
		 *  The scheduling loop.
		 *  @param  {Number}  time  The current page time starting from 0
		 *                          when the page was loaded.
		 *  @private
		 */
		Clock.prototype._loop = function(){
			//get the frequency value to compute the value of the next loop
			var now = this.now();
			//if it's started
			var lookAhead = this.context.lookAhead;
			var updateInterval = this.context.updateInterval;
			var lagCompensation = this.context.lag * 2;
			var loopInterval = now + lookAhead + updateInterval + lagCompensation;
			while (loopInterval > this._nextTick && this._state){
				var currentState = this._state.getValueAtTime(this._nextTick);
				if (currentState !== this._lastState){
					this._lastState = currentState;
					var event = this._state.get(this._nextTick);
					// emit an event
					if (currentState === State.Started){
						//correct the time
						this._nextTick = event.time;
						if (!this.isUndef(event.offset)){
							this.ticks = event.offset;
						}
						this.emit("start", event.time, this.ticks);
					} else if (currentState === State.Stopped){
						this.ticks = 0;

						this.emit("stop", event.time);
					} else if (currentState === State.Paused){
						this.emit("pause", event.time);
					}
				}
				var tickTime = this._nextTick;
				if (this.frequency){
					this._nextTick += 1 / this.frequency.getValueAtTime(this._nextTick);
					if (currentState === State.Started){
						this.callback(tickTime);
						this.ticks++;
					}
				}
			}
		};

		/**
		 *  Returns the scheduled state at the given time.
		 *  @param  {Time}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 *  @example
		 * clock.start("+0.1");
		 * clock.getStateAtTime("+0.1"); //returns "started"
		 */
		Clock.prototype.getStateAtTime = function(time){
			time = this.toSeconds(time);
			return this._state.getValueAtTime(time);
		};

		/**
		 *  Clean up
		 *  @returns {Clock} this
		 */
		Clock.prototype.dispose = function(){
			Emitter.prototype.dispose.call(this);
			this.context.off("tick", this._boundLoop);
			this._writable("frequency");
			this.frequency.dispose();
			this.frequency = null;
			this._boundLoop = null;
			this._nextTick = Infinity;
			this.callback = null;
			this._state.dispose();
			this._state = null;
		};

	/**
		 *  @class Similar to Timeline, but all events represent
		 *         intervals with both "time" and "duration" times. The
		 *         events are placed in a tree structure optimized
		 *         for querying an intersection point with the timeline
		 *         events. Internally uses an [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)
		 *         to represent the data.
		 *  @extends {Tone}
		 */
		var IntervalTimeline = function(){

			/**
			 *  The root node of the inteval tree
			 *  @type  {IntervalNode}
			 *  @private
			 */
			this._root = null;

			/**
			 *  Keep track of the length of the timeline.
			 *  @type  {Number}
			 *  @private
			 */
			this._length = 0;
		};

		Tone$1.extend(IntervalTimeline);

		/**
		 *  The event to add to the timeline. All events must
		 *  have a time and duration value
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {IntervalTimeline}  this
		 */
		IntervalTimeline.prototype.add = function(event){
			if (this.isUndef(event.time) || this.isUndef(event.duration)){
				throw new Error("IntervalTimeline: events must have time and duration parameters");
			}
			var node = new IntervalNode(event.time, event.time + event.duration, event);
			if (this._root === null){
				this._root = node;
			} else {
				this._root.insert(node);
			}
			this._length++;
			// Restructure tree to be balanced
			while (node !== null) {
				node.updateHeight();
				node.updateMax();
				this._rebalance(node);
				node = node.parent;
			}
			return this;
		};

		/**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event to remove from the timeline
		 *  @return  {IntervalTimeline}  this
		 */
		IntervalTimeline.prototype.remove = function(event){
			if (this._root !== null){
				var results = [];
				this._root.search(event.time, results);
				for (var i = 0; i < results.length; i++){
					var node = results[i];
					if (node.event === event){
						this._removeNode(node);
						this._length--;
						break;
					}
				}
			}
			return this;
		};

		/**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf IntervalTimeline#
		 *  @name length
		 *  @readOnly
		 */
		Object.defineProperty(IntervalTimeline.prototype, "length", {
			get : function(){
				return this._length;
			}
		});

		/**
		 *  Remove events whose time time is after the given time
		 *  @param  {Number}  time  The time to query.
		 *  @returns {IntervalTimeline} this
		 */
		IntervalTimeline.prototype.cancel = function(after){
			this.forEachAfter(after, function(event){
				this.remove(event);
			}.bind(this));
			return this;
		};

		/**
		 *  Set the root node as the given node
		 *  @param {IntervalNode} node
		 *  @private
		 */
		IntervalTimeline.prototype._setRoot = function(node){
			this._root = node;
			if (this._root !== null){
				this._root.parent = null;
			}
		};

		/**
		 *  Replace the references to the node in the node's parent
		 *  with the replacement node.
		 *  @param  {IntervalNode}  node
		 *  @param  {IntervalNode}  replacement
		 *  @private
		 */
		IntervalTimeline.prototype._replaceNodeInParent = function(node, replacement){
			if (node.parent !== null){
				if (node.isLeftChild()){
					node.parent.left = replacement;
				} else {
					node.parent.right = replacement;
				}
				this._rebalance(node.parent);
			} else {
				this._setRoot(replacement);
			}
		};

		/**
		 *  Remove the node from the tree and replace it with
		 *  a successor which follows the schema.
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		IntervalTimeline.prototype._removeNode = function(node){
			if (node.left === null && node.right === null){
				this._replaceNodeInParent(node, null);
			} else if (node.right === null){
				this._replaceNodeInParent(node, node.left);
			} else if (node.left === null){
				this._replaceNodeInParent(node, node.right);
			} else {
				var balance = node.getBalance();
				var replacement, temp;
				if (balance > 0){
					if (node.left.right === null){
						replacement = node.left;
						replacement.right = node.right;
						temp = replacement;
					} else {
						replacement = node.left.right;
						while (replacement.right !== null){
							replacement = replacement.right;
						}
						replacement.parent.right = replacement.left;
						temp = replacement.parent;
						replacement.left = node.left;
						replacement.right = node.right;
					}
				} else {
					if (node.right.left === null){
						replacement = node.right;
						replacement.left = node.left;
						temp = replacement;
					} else {
						replacement = node.right.left;
						while (replacement.left !== null) {
							replacement = replacement.left;
						}
						replacement.parent = replacement.parent;
						replacement.parent.left = replacement.right;
						temp = replacement.parent;
						replacement.left = node.left;
						replacement.right = node.right;
					}
				}
				if (node.parent !== null){
					if (node.isLeftChild()){
						node.parent.left = replacement;
					} else {
						node.parent.right = replacement;
					}
				} else {
					this._setRoot(replacement);
				}
				// this._replaceNodeInParent(node, replacement);
				this._rebalance(temp);
			}
			node.dispose();
		};

		/**
		 *  Rotate the tree to the left
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		IntervalTimeline.prototype._rotateLeft = function(node){
			var parent = node.parent;
			var isLeftChild = node.isLeftChild();

			// Make node.right the new root of this sub tree (instead of node)
			var pivotNode = node.right;
			node.right = pivotNode.left;
			pivotNode.left = node;

			if (parent !== null){
				if (isLeftChild){
					parent.left = pivotNode;
				} else{
					parent.right = pivotNode;
				}
			} else{
				this._setRoot(pivotNode);
			}
		};

		/**
		 *  Rotate the tree to the right
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		IntervalTimeline.prototype._rotateRight = function(node){
			var parent = node.parent;
			var isLeftChild = node.isLeftChild();

			// Make node.left the new root of this sub tree (instead of node)
			var pivotNode = node.left;
			node.left = pivotNode.right;
			pivotNode.right = node;

			if (parent !== null){
				if (isLeftChild){
					parent.left = pivotNode;
				} else{
					parent.right = pivotNode;
				}
			} else{
				this._setRoot(pivotNode);
			}
		};

		/**
		 *  Balance the BST
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
		IntervalTimeline.prototype._rebalance = function(node){
			var balance = node.getBalance();
			if (balance > 1){
				if (node.left.getBalance() < 0){
					this._rotateLeft(node.left);
				} else {
					this._rotateRight(node);
				}
			} else if (balance < -1) {
				if (node.right.getBalance() > 0){
					this._rotateRight(node.right);
				} else {
					this._rotateLeft(node);
				}
			}
		};

		/**
		 *  Get an event whose time and duration span the give time. Will
		 *  return the match whose "time" value is closest to the given time.
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {Object}  The event which spans the desired time
		 */
		IntervalTimeline.prototype.get = function(time){
			if (this._root !== null){
				var results = [];
				this._root.search(time, results);
				if (results.length > 0){
					var max = results[0];
					for (var i = 1; i < results.length; i++){
						if (results[i].low > max.low){
							max = results[i];
						}
					}
					return max.event;
				}
			}
			return null;
		};

		/**
		 *  Iterate over everything in the timeline.
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {IntervalTimeline} this
		 */
		IntervalTimeline.prototype.forEach = function(callback){
			if (this._root !== null){
				var allNodes = [];
				if (this._root !== null){
					this._root.traverse(function(node){
						allNodes.push(node);
					});
				}
				for (var i = 0; i < allNodes.length; i++){
					var ev = allNodes[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};

		/**
		 *  Iterate over everything in the array in which the given time
		 *  overlaps with the time and duration time of the event.
		 *  @param  {Number}  time The time to check if items are overlapping
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {IntervalTimeline} this
		 */
		IntervalTimeline.prototype.forEachAtTime = function(time, callback){
			if (this._root !== null){
				var results = [];
				this._root.search(time, results);
				for (var i = results.length - 1; i >= 0; i--){
					var ev = results[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};

		/**
		 *  Iterate over everything in the array in which the time is greater
		 *  than the given time.
		 *  @param  {Number}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {IntervalTimeline} this
		 */
		IntervalTimeline.prototype.forEachAfter = function(time, callback){
			if (this._root !== null){
				var results = [];
				this._root.searchAfter(time, results);
				for (var i = results.length - 1; i >= 0; i--){
					var ev = results[i].event;
					if (ev){
						callback(ev);
					}
				}
			}
			return this;
		};

		/**
		 *  Clean up
		 *  @return  {IntervalTimeline}  this
		 */
		IntervalTimeline.prototype.dispose = function() {
			var allNodes = [];
			if (this._root !== null){
				this._root.traverse(function(node){
					allNodes.push(node);
				});
			}
			for (var i = 0; i < allNodes.length; i++){
				allNodes[i].dispose();
			}
			allNodes = null;
			this._root = null;
			return this;
		};

		///////////////////////////////////////////////////////////////////////////
		//	INTERVAL NODE HELPER
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Represents a node in the binary search tree, with the addition
		 *  of a "high" value which keeps track of the highest value of
		 *  its children.
		 *  References:
		 *  https://brooknovak.wordpress.com/2013/12/07/augmented-interval-tree-in-c/
		 *  http://www.mif.vu.lt/~valdas/ALGORITMAI/LITERATURA/Cormen/Cormen.pdf
		 *  @param {Number} low
		 *  @param {Number} high
		 *  @private
		 */
		var IntervalNode = function(low, high, event){
			//the event container
			this.event = event;
			//the low value
			this.low = low;
			//the high value
			this.high = high;
			//the high value for this and all child nodes
			this.max = this.high;
			//the nodes to the left
			this._left = null;
			//the nodes to the right
			this._right = null;
			//the parent node
			this.parent = null;
			//the number of child nodes
			this.height = 0;
		};

		/**
		 *  Insert a node into the correct spot in the tree
		 *  @param  {IntervalNode}  node
		 */
		IntervalNode.prototype.insert = function(node) {
			if (node.low <= this.low){
				if (this.left === null){
					this.left = node;
				} else {
					this.left.insert(node);
				}
			} else {
				if (this.right === null){
					this.right = node;
				} else {
					this.right.insert(node);
				}
			}
		};

		/**
		 *  Search the tree for nodes which overlap
		 *  with the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
		IntervalNode.prototype.search = function(point, results) {
			// If p is to the right of the rightmost point of any interval
			// in this node and all children, there won't be any matches.
			if (point > this.max){
				return;
			}
			// Search left children
			if (this.left !== null){
				this.left.search(point, results);
			}
			// Check this node
			if (this.low <= point && this.high > point){
				results.push(this);
			}
			// If p is to the left of the time of this interval,
			// then it can't be in any child to the right.
			if (this.low > point){
				return;
			}
			// Search right children
			if (this.right !== null){
				this.right.search(point, results);
			}
		};

		/**
		 *  Search the tree for nodes which are less
		 *  than the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
		IntervalNode.prototype.searchAfter = function(point, results) {
			// Check this node
			if (this.low >= point){
				results.push(this);
				if (this.left !== null){
					this.left.searchAfter(point, results);
				}
			}
			// search the right side
			if (this.right !== null){
				this.right.searchAfter(point, results);
			}
		};

		/**
		 *  Invoke the callback on this element and both it's branches
		 *  @param  {Function}  callback
		 */
		IntervalNode.prototype.traverse = function(callback){
			callback(this);
			if (this.left !== null){
				this.left.traverse(callback);
			}
			if (this.right !== null){
				this.right.traverse(callback);
			}
		};

		/**
		 *  Update the height of the node
		 */
		IntervalNode.prototype.updateHeight = function(){
			if (this.left !== null && this.right !== null){
				this.height = Math.max(this.left.height, this.right.height) + 1;
			} else if (this.right !== null){
				this.height = this.right.height + 1;
			} else if (this.left !== null){
				this.height = this.left.height + 1;
			} else {
				this.height = 0;
			}
		};

		/**
		 *  Update the height of the node
		 */
		IntervalNode.prototype.updateMax = function(){
			this.max = this.high;
			if (this.left !== null){
				this.max = Math.max(this.max, this.left.max);
			}
			if (this.right !== null){
				this.max = Math.max(this.max, this.right.max);
			}
		};

		/**
		 *  The balance is how the leafs are distributed on the node
		 *  @return  {Number}  Negative numbers are balanced to the right
		 */
		IntervalNode.prototype.getBalance = function() {
			var balance = 0;
			if (this.left !== null && this.right !== null){
				balance = this.left.height - this.right.height;
			} else if (this.left !== null){
				balance = this.left.height + 1;
			} else if (this.right !== null){
				balance = -(this.right.height + 1);
			}
			return balance;
		};

		/**
		 *  @returns {Boolean} true if this node is the left child
		 *  of its parent
		 */
		IntervalNode.prototype.isLeftChild = function() {
			return this.parent !== null && this.parent.left === this;
		};

		/**
		 *  get/set the left node
		 *  @type {IntervalNode}
		 */
		Object.defineProperty(IntervalNode.prototype, "left", {
			get : function(){
				return this._left;
			},
			set : function(node){
				this._left = node;
				if (node !== null){
					node.parent = this;
				}
				this.updateHeight();
				this.updateMax();
			}
		});

		/**
		 *  get/set the right node
		 *  @type {IntervalNode}
		 */
		Object.defineProperty(IntervalNode.prototype, "right", {
			get : function(){
				return this._right;
			},
			set : function(node){
				this._right = node;
				if (node !== null){
					node.parent = this;
				}
				this.updateHeight();
				this.updateMax();
			}
		});

		/**
		 *  null out references.
		 */
		IntervalNode.prototype.dispose = function() {
			this.parent = null;
			this._left = null;
			this._right = null;
			this.event = null;
		};

		///////////////////////////////////////////////////////////////////////////
		//	END INTERVAL NODE HELPER
		///////////////////////////////////////////////////////////////////////////

	/**
		 *  @class  Transport for timing musical events.
		 *          Supports tempo curves and time changes. Unlike browser-based timing (setInterval, requestAnimationFrame)
		 *          Transport timing events pass in the exact time of the scheduled event
		 *          in the argument of the callback function. Pass that time value to the object
		 *          you're scheduling. <br><br>
		 *          A single transport is created for you when the library is initialized.
		 *          <br><br>
		 *          The transport emits the events: "start", "stop", "pause", and "loop" which are
		 *          called with the time of that event as the argument.
		 *
		 *  @extends {Emitter}
		 *  @singleton
		 *  @example
		 * //repeated event every 8th note
		 * Transport.scheduleRepeat(function(time){
		 * 	//do something with the time
		 * }, "8n");
		 *  @example
		 * //schedule an event on the 16th measure
		 * Transport.schedule(function(time){
		 * 	//do something with the time
		 * }, "16:0:0");
		 */
		var Transport$1 = function(){

			Emitter.call(this);

			///////////////////////////////////////////////////////////////////////
			//	LOOPING
			//////////////////////////////////////////////////////////////////////

			/**
			 * 	If the transport loops or not.
			 *  @type {boolean}
			 */
			this.loop = false;

			/**
			 * 	The loop start position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
			this._loopStart = 0;

			/**
			 * 	The loop end position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
			this._loopEnd = 0;

			///////////////////////////////////////////////////////////////////////
			//	CLOCK/TEMPO
			//////////////////////////////////////////////////////////////////////

			/**
			 *  Pulses per quarter is the number of ticks per quarter note.
			 *  @private
			 *  @type  {Number}
			 */
			this._ppq = TransportConstructor.defaults.PPQ;

			/**
			 *  watches the main oscillator for timing ticks
			 *  initially starts at 120bpm
			 *  @private
			 *  @type {Clock}
			 */
			this._clock = new Clock({
				"callback" : this._processTick.bind(this),
				"frequency" : 0,
			});

			this._bindClockEvents();

			/**
			 *  The Beats Per Minute of the Transport.
			 *  @type {BPM}
			 *  @signal
			 *  @example
			 * Transport.bpm.value = 80;
			 * //ramp the bpm to 120 over 10 seconds
			 * Transport.bpm.rampTo(120, 10);
			 */
			this.bpm = this._clock.frequency;
			this.bpm._toUnits = this._toUnits.bind(this);
			this.bpm._fromUnits = this._fromUnits.bind(this);
			this.bpm.units = Type$1.BPM;
			this.bpm.value = TransportConstructor.defaults.bpm;
			this._readOnly("bpm");

			/**
			 *  The time signature, or more accurately the numerator
			 *  of the time signature over a denominator of 4.
			 *  @type {Number}
			 *  @private
			 */
			this._timeSignature = TransportConstructor.defaults.timeSignature;

			///////////////////////////////////////////////////////////////////////
			//	TIMELINE EVENTS
			//////////////////////////////////////////////////////////////////////

			/**
			 *  All the events in an object to keep track by ID
			 *  @type {Object}
			 *  @private
			 */
			this._scheduledEvents = {};

			/**
			 *  The event ID counter
			 *  @type {Number}
			 *  @private
			 */
			this._eventID = 0;

			/**
			 * 	The scheduled events.
			 *  @type {Timeline}
			 *  @private
			 */
			this._timeline = new Timeline();

			/**
			 *  Repeated events
			 *  @type {Array}
			 *  @private
			 */
			this._repeatedEvents = new IntervalTimeline();

			/**
			 *  Events that occur once
			 *  @type {Array}
			 *  @private
			 */
			this._onceEvents = new Timeline();

			/**
			 *  All of the synced Signals
			 *  @private
			 *  @type {Array}
			 */
			this._syncedSignals = [];

			///////////////////////////////////////////////////////////////////////
			//	SWING
			//////////////////////////////////////////////////////////////////////

			/**
			 *  The subdivision of the swing
			 *  @type  {Ticks}
			 *  @private
			 */
			this._swingTicks = TransportConstructor.defaults.PPQ / 2; //8n

			/**
			 *  The swing amount
			 *  @type {NormalRange}
			 *  @private
			 */
			this._swingAmount = 0;

		};

		Tone$1.extend(Transport$1, Emitter);

		/**
		 *  the defaults
		 *  @type {Object}
		 *  @const
		 *  @static
		 */
		Transport$1.defaults = {
			"bpm" : 120,
			"swing" : 0,
			"swingSubdivision" : "8n",
			"timeSignature" : 4,
			"loopStart" : 0,
			"loopEnd" : "4m",
			"PPQ" : 192
		};

		///////////////////////////////////////////////////////////////////////////////
		//	TICKS
		///////////////////////////////////////////////////////////////////////////////

		/**
		 *  called on every tick
		 *  @param   {number} tickTime clock relative tick time
		 *  @private
		 */
		Transport$1.prototype._processTick = function(tickTime){
			var ticks = this._clock.ticks;
			//handle swing
			if (this._swingAmount > 0 &&
				ticks % this._ppq !== 0 && //not on a downbeat
				ticks % (this._swingTicks * 2) !== 0){
				//add some swing
				var progress = (ticks % (this._swingTicks * 2)) / (this._swingTicks * 2);
				var amount = Math.sin((progress) * Math.PI) * this._swingAmount;
				tickTime += Time(this._swingTicks * 2/3, "i").eval() * amount;
			}
			//do the loop test
			if (this.loop){
				if (ticks === this._loopEnd){
					this.emit("loopEnd", tickTime);
					this._clock.ticks = this._loopStart;
					ticks = this._loopStart;
					this.emit("loopStart", tickTime, this.seconds);
					this.emit("loop", tickTime);
				}
			}
			//process the single occurrence events
			this._onceEvents.forEachBefore(ticks, function(event){
				event.callback(tickTime);
				//remove the event
				delete this._scheduledEvents[event.id.toString()];
			}.bind(this));
			//and clear the single occurrence timeline
			this._onceEvents.cancelBefore(ticks);
			//fire the next tick events if their time has come
			this._timeline.forEachAtTime(ticks, function(event){
				event.callback(tickTime);
			});
			//process the repeated events
			this._repeatedEvents.forEachAtTime(ticks, function(event){
				if ((ticks - event.time) % event.interval === 0){
					event.callback(tickTime);
				}
			});
		};

		///////////////////////////////////////////////////////////////////////////////
		//	SCHEDULABLE EVENTS
		///////////////////////////////////////////////////////////////////////////////

		/**
		 *  Schedule an event along the timeline.
		 *  @param {Function} callback The callback to be invoked at the time.
		 *  @param {TransportTime}  time The time to invoke the callback at.
		 *  @return {Number} The id of the event which can be used for canceling the event.
		 *  @example
		 * //trigger the callback when the Transport reaches the desired time
		 * Transport.schedule(function(time){
		 * 	envelope.triggerAttack(time);
		 * }, "128i");
		 */
		Transport$1.prototype.schedule = function(callback, time){
			var event = {
				"time" : this.toTicks(time),
				"callback" : callback
			};
			var id = this._eventID++;
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._timeline
			};
			this._timeline.add(event);
			return id;
		};

		/**
		 *  Schedule a repeated event along the timeline. The event will fire
		 *  at the `interval` starting at the `startTime` and for the specified
		 *  `duration`.
		 *  @param  {Function}  callback   The callback to invoke.
		 *  @param  {Time}    interval   The duration between successive
		 *                               callbacks.
		 *  @param  {TimelinePosition=}    startTime  When along the timeline the events should
		 *                               start being invoked.
		 *  @param {Time} [duration=Infinity] How long the event should repeat.
		 *  @return  {Number}    The ID of the scheduled event. Use this to cancel
		 *                           the event.
		 *  @example
		 * //a callback invoked every eighth note after the first measure
		 * Transport.scheduleRepeat(callback, "8n", "1m");
		 */
		Transport$1.prototype.scheduleRepeat = function(callback, interval, startTime, duration){
			if (interval <= 0){
				throw new Error("Transport: repeat events must have an interval larger than 0");
			}
			var event = {
				"time" : this.toTicks(startTime),
				"duration" : this.toTicks(this.defaultArg(duration, Infinity)),
				"interval" : this.toTicks(interval),
				"callback" : callback
			};
			var id = this._eventID++;
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._repeatedEvents
			};
			this._repeatedEvents.add(event);
			return id;
		};

		/**
		 *  Schedule an event that will be removed after it is invoked.
		 *  Note that if the given time is less than the current transport time,
		 *  the event will be invoked immediately.
		 *  @param {Function} callback The callback to invoke once.
		 *  @param {TransportTime} time The time the callback should be invoked.
		 *  @returns {Number} The ID of the scheduled event.
		 */
		Transport$1.prototype.scheduleOnce = function(callback, time){
			var id = this._eventID++;
			var event = {
				"time" : this.toTicks(time),
				"callback" : callback,
				"id" : id
			};
			this._scheduledEvents[id.toString()] = {
				"event" : event,
				"timeline" : this._onceEvents
			};
			this._onceEvents.add(event);
			return id;
		};

		/**
		 *  Clear the passed in event id from the timeline
		 *  @param {Number} eventId The id of the event.
		 *  @returns {Transport} this
		 */
		Transport$1.prototype.clear = function(eventId){
			if (this._scheduledEvents.hasOwnProperty(eventId)){
				var item = this._scheduledEvents[eventId.toString()];
				item.timeline.remove(item.event);
				delete this._scheduledEvents[eventId.toString()];
			}
			return this;
		};

		/**
		 *  Remove scheduled events from the timeline after
		 *  the given time. Repeated events will be removed
		 *  if their startTime is after the given time
		 *  @param {TransportTime} [after=0] Clear all events after
		 *                          this time.
		 *  @returns {Transport} this
		 */
		Transport$1.prototype.cancel = function(after){
			after = this.defaultArg(after, 0);
			after = this.toTicks(after);
			this._timeline.cancel(after);
			this._onceEvents.cancel(after);
			this._repeatedEvents.cancel(after);
			return this;
		};

		///////////////////////////////////////////////////////////////////////////////
		//	START/STOP/PAUSE
		///////////////////////////////////////////////////////////////////////////////

		/**
		 *  Bind start/stop/pause events from the clock and emit them.
		 */
		Transport$1.prototype._bindClockEvents = function(){
			this._clock.on("start", function(time, offset){
				offset = Time(this._clock.ticks, "i").toSeconds();
				this.emit("start", time, offset);
			}.bind(this));

			this._clock.on("stop", function(time){
				this.emit("stop", time);
			}.bind(this));

			this._clock.on("pause", function(time){
				this.emit("pause", time);
			}.bind(this));
		};

		/**
		 *  Returns the playback state of the source, either "started", "stopped", or "paused"
		 *  @type {State}
		 *  @readOnly
		 *  @memberOf Transport#
		 *  @name state
		 */
		Object.defineProperty(Transport$1.prototype, "state", {
			get : function(){
				return this._clock.getStateAtTime(this.now());
			}
		});

		/**
		 *  Start the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should start.
		 *  @param  {TransportTime=} offset The timeline offset to start the transport.
		 *  @returns {Transport} this
		 *  @example
		 * //start the transport in one second starting at beginning of the 5th measure.
		 * Transport.start("+1", "4:0:0");
		 */
		Transport$1.prototype.start = function(time, offset){
			//start the clock
			if (!this.isUndef(offset)){
				offset = this.toTicks(offset);
			}
			this._clock.start(time, offset);
			return this;
		};

		/**
		 *  Stop the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should stop.
		 *  @returns {Transport} this
		 *  @example
		 * Transport.stop();
		 */
		Transport$1.prototype.stop = function(time){
			this._clock.stop(time);
			return this;
		};

		/**
		 *  Pause the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now]
		 *  @returns {Transport} this
		 */
		Transport$1.prototype.pause = function(time){
			this._clock.pause(time);
			return this;
		};

		///////////////////////////////////////////////////////////////////////////////
		//	SETTERS/GETTERS
		///////////////////////////////////////////////////////////////////////////////

		/**
		 *  The time signature as just the numerator over 4.
		 *  For example 4/4 would be just 4 and 6/8 would be 3.
		 *  @memberOf Transport#
		 *  @type {Number|Array}
		 *  @name timeSignature
		 *  @example
		 * //common time
		 * Transport.timeSignature = 4;
		 * // 7/8
		 * Transport.timeSignature = [7, 8];
		 * //this will be reduced to a single number
		 * Transport.timeSignature; //returns 3.5
		 */
		Object.defineProperty(Transport$1.prototype, "timeSignature", {
			get : function(){
				return this._timeSignature;
			},
			set : function(timeSig){
				if (this.isArray(timeSig)){
					timeSig = (timeSig[0] / timeSig[1]) * 4;
				}
				this._timeSignature = timeSig;
			}
		});


		/**
		 * When the Transport.loop = true, this is the starting position of the loop.
		 * @memberOf Transport#
		 * @type {TransportTime}
		 * @name loopStart
		 */
		Object.defineProperty(Transport$1.prototype, "loopStart", {
			get : function(){
				return TransportTime(this._loopStart, "i").toSeconds();
			},
			set : function(startPosition){
				this._loopStart = this.toTicks(startPosition);
			}
		});

		/**
		 * When the Transport.loop = true, this is the ending position of the loop.
		 * @memberOf Transport#
		 * @type {TransportTime}
		 * @name loopEnd
		 */
		Object.defineProperty(Transport$1.prototype, "loopEnd", {
			get : function(){
				return TransportTime(this._loopEnd, "i").toSeconds();
			},
			set : function(endPosition){
				this._loopEnd = this.toTicks(endPosition);
			}
		});

		/**
		 *  Set the loop start and stop at the same time.
		 *  @param {TransportTime} startPosition
		 *  @param {TransportTime} endPosition
		 *  @returns {Transport} this
		 *  @example
		 * //loop over the first measure
		 * Transport.setLoopPoints(0, "1m");
		 * Transport.loop = true;
		 */
		Transport$1.prototype.setLoopPoints = function(startPosition, endPosition){
			this.loopStart = startPosition;
			this.loopEnd = endPosition;
			return this;
		};

		/**
		 *  The swing value. Between 0-1 where 1 equal to
		 *  the note + half the subdivision.
		 *  @memberOf Transport#
		 *  @type {NormalRange}
		 *  @name swing
		 */
		Object.defineProperty(Transport$1.prototype, "swing", {
			get : function(){
				return this._swingAmount;
			},
			set : function(amount){
				//scale the values to a normal range
				this._swingAmount = amount;
			}
		});

		/**
		 *  Set the subdivision which the swing will be applied to.
		 *  The default value is an 8th note. Value must be less
		 *  than a quarter note.
		 *
		 *  @memberOf Transport#
		 *  @type {Time}
		 *  @name swingSubdivision
		 */
		Object.defineProperty(Transport$1.prototype, "swingSubdivision", {
			get : function(){
				return Time(this._swingTicks, "i").toNotation();
			},
			set : function(subdivision){
				this._swingTicks = this.toTicks(subdivision);
			}
		});

		/**
		 *  The Transport's position in Bars:Beats:Sixteenths.
		 *  Setting the value will jump to that position right away.
		 *  @memberOf Transport#
		 *  @type {BarsBeatsSixteenths}
		 *  @name position
		 */
		Object.defineProperty(Transport$1.prototype, "position", {
			get : function(){
				return TransportTime(this.ticks, "i").toBarsBeatsSixteenths();
			},
			set : function(progress){
				var ticks = this.toTicks(progress);
				this.ticks = ticks;
			}
		});

		/**
		 *  The Transport's position in seconds
		 *  Setting the value will jump to that position right away.
		 *  @memberOf Transport#
		 *  @type {Seconds}
		 *  @name seconds
		 */
		Object.defineProperty(Transport$1.prototype, "seconds", {
			get : function(){
				return TransportTime(this.ticks, "i").toSeconds();
			},
			set : function(progress){
				var ticks = this.toTicks(progress);
				this.ticks = ticks;
			}
		});

		/**
		 *  The Transport's loop position as a normalized value. Always
		 *  returns 0 if the transport if loop is not true.
		 *  @memberOf Transport#
		 *  @name progress
		 *  @type {NormalRange}
		 */
		Object.defineProperty(Transport$1.prototype, "progress", {
			get : function(){
				if (this.loop){
					return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
				} else {
					return 0;
				}
			}
		});

		/**
		 *  The transports current tick position.
		 *
		 *  @memberOf Transport#
		 *  @type {Ticks}
		 *  @name ticks
		 */
		Object.defineProperty(Transport$1.prototype, "ticks", {
			get : function(){
				return this._clock.ticks;
			},
			set : function(t){
				var now = this.now();
				//stop everything synced to the transport
				if (this.state === State.Started){
					this.emit("stop", now);
					this._clock.ticks = t;
					//restart it with the new time
					this.emit("start", now, this.seconds);
				} else {
					this._clock.ticks = t;
				}
			}
		});

		/**
		 *  Pulses Per Quarter note. This is the smallest resolution
		 *  the Transport timing supports. This should be set once
		 *  on initialization and not set again. Changing this value
		 *  after other objects have been created can cause problems.
		 *
		 *  @memberOf Transport#
		 *  @type {Number}
		 *  @name PPQ
		 */
		Object.defineProperty(Transport$1.prototype, "PPQ", {
			get : function(){
				return this._ppq;
			},
			set : function(ppq){
				var bpm = this.bpm.value;
				this._ppq = ppq;
				this.bpm.value = bpm;
			}
		});

		/**
		 *  The hint to the type of playback. Affects tradeoffs between audio
		 *  output latency and responsiveness.
		 *
		 *  In addition to setting the value in seconds, the latencyHint also
		 *  accepts the strings "interactive" (prioritizes low latency),
		 *  "playback" (prioritizes sustained playback), "balanced" (balances
		 *  latency and performance), and "fastest" (lowest latency, might glitch more often).
		 *  @memberOf Transport#
		 *  @type {Seconds|String}
		 *  @name latencyHint
		 */
		Object.defineProperty(Transport$1.prototype, "latencyHint", {
			get : function(){
				return Clock.latencyHint;
			},
			set : function(hint){
				Clock.latencyHint = hint;
			}
		});

		/**
		 *  Convert from BPM to frequency (factoring in PPQ)
		 *  @param  {BPM}  bpm The BPM value to convert to frequency
		 *  @return  {Frequency}  The BPM as a frequency with PPQ factored in.
		 *  @private
		 */
		Transport$1.prototype._fromUnits = function(bpm){
			return 1 / (60 / bpm / this.PPQ);
		};

		/**
		 *  Convert from frequency (with PPQ) into BPM
		 *  @param  {Frequency}  freq The clocks frequency to convert to BPM
		 *  @return  {BPM}  The frequency value as BPM.
		 *  @private
		 */
		Transport$1.prototype._toUnits = function(freq){
			return (freq / this.PPQ) * 60;
		};

		///////////////////////////////////////////////////////////////////////////////
		//	SYNCING
		///////////////////////////////////////////////////////////////////////////////

		/**
		 *  Returns the time aligned to the next subdivision
		 *  of the Transport. If the Transport is not started,
		 *  it will return 0.
		 *  Note: this will not work precisely during tempo ramps.
		 *  @param  {Time}  subdivision  The subdivision to quantize to
		 *  @return  {Number}  The context time of the next subdivision.
		 *  @example
		 * Transport.start(); //the transport must be started
		 * Transport.nextSubdivision("4n");
		 */
		Transport$1.prototype.nextSubdivision = function(subdivision){
			subdivision = this.toSeconds(subdivision);
			//if the transport's not started, return 0
			var now;
			if (this.state === State.Started){
				now = this._clock._nextTick;
			} else {
				return 0;
			}
			var transportPos = Time(this.ticks, "i").eval();
			var remainingTime = subdivision - (transportPos % subdivision);
			if (remainingTime === 0){
				remainingTime = subdivision;
			}
			return now + remainingTime;
		};

		/**
		 *  Attaches the signal to the tempo control signal so that
		 *  any changes in the tempo will change the signal in the same
		 *  ratio.
		 *
		 *  @param  {Signal} signal
		 *  @param {number=} ratio Optionally pass in the ratio between
		 *                         the two signals. Otherwise it will be computed
		 *                         based on their current values.
		 *  @returns {Transport} this
		 */
		Transport$1.prototype.syncSignal = function(signal, ratio){
			if (!ratio){
				//get the sync ratio
				if (signal._param.value !== 0){
					ratio = signal._param.value / this.bpm._param.value;
				} else {
					ratio = 0;
				}
			}
			var ratioSignal = new Gain$1(ratio);
			this.bpm.chain(ratioSignal, signal._param);
			this._syncedSignals.push({
				"ratio" : ratioSignal,
				"signal" : signal,
				"initial" : signal._param.value
			});
			signal._param.value = 0;
			return this;
		};

		/**
		 *  Unsyncs a previously synced signal from the transport's control.
		 *  See Transport.syncSignal.
		 *  @param  {Signal} signal
		 *  @returns {Transport} this
		 */
		Transport$1.prototype.unsyncSignal = function(signal){
			for (var i = this._syncedSignals.length - 1; i >= 0; i--){
				var syncedSignal = this._syncedSignals[i];
				if (syncedSignal.signal === signal){
					syncedSignal.ratio.dispose();
					syncedSignal.signal._param.value = syncedSignal.initial;
					this._syncedSignals.splice(i, 1);
				}
			}
			return this;
		};

		/**
		 *  Clean up.
		 *  @returns {Transport} this
		 *  @private
		 */
		Transport$1.prototype.dispose = function(){
			Emitter.prototype.dispose.call(this);
			this._clock.dispose();
			this._clock = null;
			this._writable("bpm");
			this.bpm = null;
			this._timeline.dispose();
			this._timeline = null;
			this._onceEvents.dispose();
			this._onceEvents = null;
			this._repeatedEvents.dispose();
			this._repeatedEvents = null;
			return this;
		};

		///////////////////////////////////////////////////////////////////////////////
		//	INITIALIZATION
		///////////////////////////////////////////////////////////////////////////////

		var TransportConstructor = Transport$1;
		Transport$1 = new TransportConstructor();

		Context.on("init", function(context){
			if (context.Transport instanceof TransportConstructor){
				Transport$1 = context.Transport;
			} else {
				Transport$1 = new TransportConstructor();
				//store the Transport on the context so it can be retrieved later
				context.Transport = Transport$1;
			}
		});

	/**
		 *  @class Volume is a simple volume node, useful for creating a volume fader.
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Decibels} [volume=0] the initial volume
		 *  @example
		 * var vol = new Volume(-12);
		 * instrument.chain(vol, Master);
		 */
		var Volume$1 = function(){

			var options = this.optionsObject(arguments, ["volume"], Volume$1.defaults);

			/**
			 * the output node
			 * @type {GainNode}
			 * @private
			 */
			this.output = this.input = new Gain$1(options.volume, Type.Decibels);

			/**
			 * The unmuted volume
			 * @type {Decibels}
			 * @private
			 */
			this._unmutedVolume = 0;

			/**
			 *  if the volume is muted
			 *  @type {Boolean}
			 *  @private
			 */
			this._muted = false;

			/**
			 *  The volume control in decibels.
			 *  @type {Decibels}
			 *  @signal
			 */
			this.volume = this.output.gain;

			this._readOnly("volume");

			//set the mute initially
			this.mute = options.mute;
		};

		Tone$1.extend(Volume$1);

		/**
		 *  Defaults
		 *  @type  {Object}
		 *  @const
		 *  @static
		 */
		Volume$1.defaults = {
			"volume" : 0,
			"mute" : false
		};

		/**
		 * Mute the output.
		 * @memberOf Volume#
		 * @type {boolean}
		 * @name mute
		 * @example
		 * //mute the output
		 * volume.mute = true;
		 */
		Object.defineProperty(Volume$1.prototype, "mute", {
			get : function(){
				return this._muted;
			},
			set : function(mute){
				if (!this._muted && mute){
					this._unmutedVolume = this.volume.value;
					//maybe it should ramp here?
					this.volume.value = -Infinity;
				} else if (this._muted && !mute){
					this.volume.value = this._unmutedVolume;
				}
				this._muted = mute;
			}
		});

		/**
		 *  clean up
		 *  @returns {Volume} this
		 */
		Volume$1.prototype.dispose = function(){
			this.input.dispose();
			Tone$1.prototype.dispose.call(this);
			this._writable("volume");
			this.volume.dispose();
			this.volume = null;
			return this;
		};

	/**
		 *  @class  A single master output which is connected to the
		 *          AudioDestinationNode (aka your speakers).
		 *          It provides useful conveniences such as the ability
		 *          to set the volume and mute the entire application.
		 *          It also gives you the ability to apply master effects to your application.
		 *          <br><br>
		 *          Like Transport, A single Master is created
		 *          on initialization and you do not need to explicitly construct one.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @singleton
		 *  @example
		 * //the audio will go from the oscillator to the speakers
		 * oscillator.connect(Master);
		 * //a convenience for connecting to the master output is also provided:
		 * oscillator.toMaster();
		 * //the above two examples are equivalent.
		 */
		var Master = function(){

			this.createInsOuts(1, 1);

			/**
			 *  The private volume node
			 *  @type  {Volume}
			 *  @private
			 */
			this._volume = this.output = new Volume$1();

			/**
			 * The volume of the master output.
			 * @type {Decibels}
			 * @signal
			 */
			this.volume = this._volume.volume;

			this._readOnly("volume");
			//connections
			this.input.chain(this.output, this.context.destination);
		};

		Tone$1.extend(Master);

		/**
		 *  @type {Object}
		 *  @const
		 */
		Master.defaults = {
			"volume" : 0,
			"mute" : false
		};

		/**
		 * Mute the output.
		 * @memberOf Master#
		 * @type {boolean}
		 * @name mute
		 * @example
		 * //mute the output
		 * Master.mute = true;
		 */
		Object.defineProperty(Master.prototype, "mute", {
			get : function(){
				return this._volume.mute;
			},
			set : function(mute){
				this._volume.mute = mute;
			}
		});

		/**
		 *  Add a master effects chain. NOTE: this will disconnect any nodes which were previously
		 *  chained in the master effects chain.
		 *  @param {AudioNode|..} args All arguments will be connected in a row
		 *                                  and the Master will be routed through it.
		 *  @return  {Master}  this
		 *  @example
		 * //some overall compression to keep the levels in check
		 * var masterCompressor = new Compressor({
		 * 	"threshold" : -6,
		 * 	"ratio" : 3,
		 * 	"attack" : 0.5,
		 * 	"release" : 0.1
		 * });
		 * //give a little boost to the lows
		 * var lowBump = new Filter(200, "lowshelf");
		 * //route everything through the filter
		 * //and compressor before going to the speakers
		 * Master.chain(lowBump, masterCompressor);
		 */
		Master.prototype.chain = function(){
			this.input.disconnect();
			this.input.chain.apply(this.input, arguments);
			arguments[arguments.length - 1].connect(this.output);
		};

		/**
		 *  Clean up
		 *  @return  {Master}  this
		 */
		Master.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._writable("volume");
			this._volume.dispose();
			this._volume = null;
			this.volume = null;
		};

		///////////////////////////////////////////////////////////////////////////
		//	AUGMENT TONE's Tone.PROTOTYPE
		///////////////////////////////////////////////////////////////////////////

		/**
		 *  Connect 'this' to the master output. Shorthand for this.connect(Master)
		 *  @returns {Tone} this
		 *  @example
		 * //connect an oscillator to the master output
		 * var osc = new Oscillator().toMaster();
		 */
		Tone$1.prototype.toMaster = function(){
			this.connect(Master);
			return this;
		};

		/**
		 *  Also augment AudioNode's Tone.prototype to include toMaster
		 *  as a convenience
		 *  @returns {AudioNode} this
		 */
		AudioNode.prototype.toMaster = function(){
			this.connect(Master);
			return this;
		};

		/**
		 *  initialize the module and listen for new audio contexts
		 */
		var MasterConstructor = Master;
		Master = new MasterConstructor();

		Context$1.on("init", function(context){
			// if it already exists, just restore it
			if (context.Master instanceof MasterConstructor){
				Master = context.Master;
			} else {
				Master = new MasterConstructor();
			}
			context.Master = Master;
		});

	/**
		 *  @class  Base class for sources. Sources have start/stop methods
		 *          and the ability to be synced to the
		 *          start/stop of Transport.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @example
		 * //Multiple state change events can be chained together,
		 * //but must be set in the correct order and with ascending times
		 *
		 * // OK
		 * state.start().stop("+0.2");
		 * // AND
		 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
		 *
		 * // BAD
		 * state.stop("+0.2").start();
		 * // OR
		 * state.start("+0.3").stop("+0.2");
		 *
		 */
		var Source = function(options){

			// this.createInsOuts(0, 1);

			options = this.defaultArg(options, Source.defaults);

			/**
			 *  The output volume node
			 *  @type  {Volume}
			 *  @private
			 */
			this._volume = this.output = new Volume$1(options.volume);

			/**
			 * The volume of the output in decibels.
			 * @type {Decibels}
			 * @signal
			 * @example
			 * source.volume.value = -6;
			 */
			this.volume = this._volume.volume;
			this._readOnly("volume");

			/**
			 * 	Keep track of the scheduled state.
			 *  @type {TimelineState}
			 *  @private
			 */
			this._state = new TimelineState(State.Stopped);
			this._state.memory = 10;

			/**
			 *  The synced `start` callback function from the transport
			 *  @type {Function}
			 *  @private
			 */
			this._synced = false;

			/**
			 *  Keep track of all of the scheduled event ids
			 *  @type  {Array}
			 *  @private
			 */
			this._scheduled = [];

			//make the output explicitly stereo
			this._volume.output.output.channelCount = 2;
			this._volume.output.output.channelCountMode = "explicit";
			//mute initially
			this.mute = options.mute;
		};

		Tone$1.extend(Source);

		/**
		 *  The default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		Source.defaults = {
			"volume" : 0,
			"mute" : false
		};

		/**
		 *  Returns the playback state of the source, either "started" or "stopped".
		 *  @type {State}
		 *  @readOnly
		 *  @memberOf Source#
		 *  @name state
		 */
		Object.defineProperty(Source.prototype, "state", {
			get : function(){
				if (this._synced){
					if (Transport$1.state === State.Started){
						return this._state.getValueAtTime(Transport$1.seconds);
					} else {
						return State.Stopped;
					}
				} else {
					return this._state.getValueAtTime(this.now());
				}
			}
		});

		/**
		 * Mute the output.
		 * @memberOf Source#
		 * @type {boolean}
		 * @name mute
		 * @example
		 * //mute the output
		 * source.mute = true;
		 */
		Object.defineProperty(Source.prototype, "mute", {
			get : function(){
				return this._volume.mute;
			},
			set : function(mute){
				this._volume.mute = mute;
			}
		});

		//overwrite these functions
		Source.prototype._start = Tone$1.noOp;
		Source.prototype._stop = Tone$1.noOp;

		/**
		 *  Start the source at the specified time. If no time is given,
		 *  start the source now.
		 *  @param  {Time} [time=now] When the source should be started.
		 *  @returns {Source} this
		 *  @example
		 * source.start("+0.5"); //starts the source 0.5 seconds from now
		 */
		Source.prototype.start = function(time, offset, duration){
			if (this.isUndef(time) && this._synced){
				time = Transport$1.seconds;
			} else {
				time = this.toSeconds(time);
			}
			//if it's started, stop it and restart it
			if (!this.retrigger && this._state.getValueAtTime(time) === State.Started){
				this.stop(time);
			}
			this._state.setStateAtTime(State.Started, time);
			if (this._synced){
				// add the offset time to the event
				var event = this._state.get(time);
				event.offset = this.defaultArg(offset, 0);
				event.duration = duration;
				var sched = Transport$1.schedule(function(t){
					this._start(t, offset, duration);
				}.bind(this), time);
				this._scheduled.push(sched);
			} else {
				this._start.apply(this, arguments);
			}
			return this;
		};

		/**
		 *  Stop the source at the specified time. If no time is given,
		 *  stop the source now.
		 *  @param  {Time} [time=now] When the source should be stopped.
		 *  @returns {Source} this
		 *  @example
		 * source.stop(); // stops the source immediately
		 */
		Source.prototype.stop = function(time){
			if (this.isUndef(time) && this._synced){
				time = Transport$1.seconds;
			} else {
				time = this.toSeconds(time);
			}
			this._state.cancel(time);
			this._state.setStateAtTime(State.Stopped, time);
			if (!this._synced){
				this._stop.apply(this, arguments);
			} else {
				var sched = Transport$1.schedule(this._stop.bind(this), time);
				this._scheduled.push(sched);
			}
			return this;
		};

		/**
		 *  Sync the source to the Transport so that all subsequent
		 *  calls to `start` and `stop` are synced to the TransportTime
		 *  instead of the AudioContext time.
		 *
		 *  @returns {Source} this
		 *  @example
		 * //sync the source so that it plays between 0 and 0.3 on the Transport's timeline
		 * source.sync().start(0).stop(0.3);
		 * //start the transport.
		 * Transport.start();
		 *
		 *  @example
		 * //start the transport with an offset and the sync'ed sources
		 * //will start in the correct position
		 * source.sync().start(0.1);
		 * //the source will be invoked with an offset of 0.4
		 * Transport.start("+0.5", 0.5);
		 */
		Source.prototype.sync = function(){
			this._synced = true;
			Transport$1.on("start loopStart", function(time, offset){
				if (offset > 0){
					// get the playback state at that time
					var stateEvent = this._state.get(offset);
					// listen for start events which may occur in the middle of the sync'ed time
					if (stateEvent && stateEvent.state === State.Started && stateEvent.time !== offset){
						// get the offset
						var startOffset = offset - this.toSeconds(stateEvent.time);
						var duration;
						if (stateEvent.duration){
							duration = this.toSeconds(stateEvent.duration) - startOffset;
						}
						this._start(time, this.toSeconds(stateEvent.offset) + startOffset, duration);
					}
				}
			}.bind(this));
			Transport$1.on("stop pause loopEnd", function(time){
				if (this._state.getValueAtTime(Transport$1.seconds) === State.Started){
					this._stop(time);
				}
			}.bind(this));
			return this;
		};

		/**
		 *  Unsync the source to the Transport. See Source.sync
		 *  @returns {Source} this
		 */
		Source.prototype.unsync = function(){
			this._synced = false;
			Transport$1.off("start stop pause loopEnd loopStart");
			// clear all of the scheduled ids
			for (var i = 0; i < this._scheduled.length; i++){
				var id = this._scheduled[i];
				Transport$1.clear(id);
			}
			this._scheduled = [];
			this._state.cancel(0);
			return this;
		};

		/**
		 *	Clean up.
		 *  @return {Source} this
		 */
		Source.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this.unsync();
			this._scheduled = null;
			this._writable("volume");
			this._volume.dispose();
			this._volume = null;
			this.volume = null;
			this._state.dispose();
			this._state = null;
		};

	/**
		 *  @class Oscillator supports a number of features including
		 *         phase rotation, multiple oscillator types (see Oscillator.type),
		 *         and Transport syncing (see Oscillator.syncFrequency).
		 *
		 *  @constructor
		 *  @extends {Source}
		 *  @param {Frequency} [frequency] Starting frequency
		 *  @param {string} [type] The oscillator type. Read more about type below.
		 *  @example
		 * //make and start a 440hz sine tone
		 * var osc = new Oscillator(440, "sine").toMaster().start();
		 */
		var Oscillator = function(){

			var options = this.optionsObject(arguments, ["frequency", "type"], Oscillator.defaults);
			Source.call(this, options);

			/**
			 *  the main oscillator
			 *  @type {OscillatorNode}
			 *  @private
			 */
			this._oscillator = null;

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal$1(options.frequency, Type.Frequency);

			/**
			 *  The detune control signal.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal$1(options.detune, Type.Cents);

			/**
			 *  the periodic wave
			 *  @type {PeriodicWave}
			 *  @private
			 */
			this._wave = null;

			/**
			 *  The partials of the oscillator
			 *  @type {Array}
			 *  @private
			 */
			this._partials = this.defaultArg(options.partials, [1]);

			/**
			 *  the phase of the oscillator
			 *  between 0 - 360
			 *  @type {number}
			 *  @private
			 */
			this._phase = options.phase;

			/**
			 *  the type of the oscillator
			 *  @type {string}
			 *  @private
			 */
			this._type = null;

			//setup
			this.type = options.type;
			this.phase = this._phase;
			this._readOnly(["frequency", "detune"]);
		};

		Tone$1.extend(Oscillator, Source);

		/**
		 *  the default parameters
		 *  @type {Object}
		 */
		Oscillator.defaults = {
			"type" : "sine",
			"frequency" : 440,
			"detune" : 0,
			"phase" : 0,
			"partials" : []
		};

		/**
		 *  The Oscillator types
		 *  @enum {String}
		 */
		Oscillator.Type = {
			Sine : "sine",
			Triangle : "triangle",
			Sawtooth : "sawtooth",
			Square : "square",
			Custom : "custom"
		};

		/**
		 *  start the oscillator
		 *  @param  {Time} [time=now]
		 *  @private
		 */
		Oscillator.prototype._start = function(time){
			//new oscillator with previous values
			this._oscillator = this.context.createOscillator();
			this._oscillator.setPeriodicWave(this._wave);
			//connect the control signal to the oscillator frequency & detune
			this._oscillator.connect(this.output);
			this.frequency.connect(this._oscillator.frequency);
			this.detune.connect(this._oscillator.detune);
			//start the oscillator
			this._oscillator.start(this.toSeconds(time));
		};

		/**
		 *  stop the oscillator
		 *  @private
		 *  @param  {Time} [time=now] (optional) timing parameter
		 *  @returns {Oscillator} this
		 */
		Oscillator.prototype._stop = function(time){
			if (this._oscillator){
				this._oscillator.stop(this.toSeconds(time));
				this._oscillator = null;
			}
			return this;
		};

		/**
		 *  Sync the signal to the Transport's bpm. Any changes to the transports bpm,
		 *  will also affect the oscillators frequency.
		 *  @returns {Oscillator} this
		 *  @example
		 * Transport.bpm.value = 120;
		 * osc.frequency.value = 440;
		 * //the ration between the bpm and the frequency will be maintained
		 * osc.syncFrequency();
		 * Transport.bpm.value = 240;
		 * // the frequency of the oscillator is doubled to 880
		 */
		Oscillator.prototype.syncFrequency = function(){
			Transport$1.syncSignal(this.frequency);
			return this;
		};

		/**
		 *  Unsync the oscillator's frequency from the Transport.
		 *  See Oscillator.syncFrequency
		 *  @returns {Oscillator} this
		 */
		Oscillator.prototype.unsyncFrequency = function(){
			Transport$1.unsyncSignal(this.frequency);
			return this;
		};

		/**
		 * The type of the oscillator: either sine, square, triangle, or sawtooth. Also capable of
		 * setting the first x number of partials of the oscillator. For example: "sine4" would
		 * set be the first 4 partials of the sine wave and "triangle8" would set the first
		 * 8 partials of the triangle wave.
		 * <br><br>
		 * Uses PeriodicWave internally even for native types so that it can set the phase.
		 * PeriodicWave equations are from the
		 * [Webkit Web Audio implementation](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/modules/webaudio/PeriodicWave.cpp&sq=package:chromium).
		 *
		 * @memberOf Oscillator#
		 * @type {string}
		 * @name type
		 * @example
		 * //set it to a square wave
		 * osc.type = "square";
		 * @example
		 * //set the first 6 partials of a sawtooth wave
		 * osc.type = "sawtooth6";
		 */
		Object.defineProperty(Oscillator.prototype, "type", {
			get : function(){
				return this._type;
			},
			set : function(type){
				var coefs = this._getRealImaginary(type, this._phase);
				var periodicWave = this.context.createPeriodicWave(coefs[0], coefs[1]);
				this._wave = periodicWave;
				if (this._oscillator !== null){
					this._oscillator.setPeriodicWave(this._wave);
				}
				this._type = type;
			}
		});

		/**
		 *  Returns the real and imaginary components based
		 *  on the oscillator type.
		 *  @returns {Array} [real, imaginary]
		 *  @private
		 */
		Oscillator.prototype._getRealImaginary = function(type, phase){
			var fftSize = 4096;
			var periodicWaveSize = fftSize / 2;

			var real = new Float32Array(periodicWaveSize);
			var imag = new Float32Array(periodicWaveSize);

			var partialCount = 1;
			if (type === Oscillator.Type.Custom){
				partialCount = this._partials.length + 1;
				periodicWaveSize = partialCount;
			} else {
				var partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
				if (partial){
					partialCount = parseInt(partial[2]) + 1;
					type = partial[1];
					partialCount = Math.max(partialCount, 2);
					periodicWaveSize = partialCount;
				}
			}

			for (var n = 1; n < periodicWaveSize; ++n) {
				var piFactor = 2 / (n * Math.PI);
				var b;
				switch (type) {
					case Oscillator.Type.Sine:
						b = (n <= partialCount) ? 1 : 0;
						break;
					case Oscillator.Type.Square:
						b = (n & 1) ? 2 * piFactor : 0;
						break;
					case Oscillator.Type.Sawtooth:
						b = piFactor * ((n & 1) ? 1 : -1);
						break;
					case Oscillator.Type.Triangle:
						if (n & 1) {
							b = 2 * (piFactor * piFactor) * ((((n - 1) >> 1) & 1) ? -1 : 1);
						} else {
							b = 0;
						}
						break;
					case Oscillator.Type.Custom:
						b = this._partials[n - 1];
						break;
					default:
						throw new TypeError("Oscillator: invalid type: "+type);
				}
				if (b !== 0){
					real[n] = -b * Math.sin(phase * n);
					imag[n] = b * Math.cos(phase * n);
				} else {
					real[n] = 0;
					imag[n] = 0;
				}
			}
			return [real, imag];
		};

		/**
		 *  Compute the inverse FFT for a given phase.
		 *  @param  {Float32Array}  real
		 *  @param  {Float32Array}  imag
		 *  @param  {NormalRange}  phase
		 *  @return  {AudioRange}
		 *  @private
		 */
		Oscillator.prototype._inverseFFT = function(real, imag, phase){
			var sum = 0;
			var len = real.length;
			for (var i = 0; i < len; i++){
				sum += real[i] * Math.cos(i * phase) + imag[i] * Math.sin(i * phase);
			}
			return sum;
		};

		/**
		 *  Returns the initial value of the oscillator.
		 *  @return  {AudioRange}
		 *  @private
		 */
		Oscillator.prototype._getInitialValue = function(){
			var coefs = this._getRealImaginary(this._type, 0);
			var real = coefs[0];
			var imag = coefs[1];
			var maxValue = 0;
			var twoPi = Math.PI * 2;
			//check for peaks in 8 places
			for (var i = 0; i < 8; i++){
				maxValue = Math.max(this._inverseFFT(real, imag, (i / 8) * twoPi), maxValue);
			}
			return -this._inverseFFT(real, imag, this._phase) / maxValue;
		};

		/**
		 * The partials of the waveform. A partial represents
		 * the amplitude at a harmonic. The first harmonic is the
		 * fundamental frequency, the second is the octave and so on
		 * following the harmonic series.
		 * Setting this value will automatically set the type to "custom".
		 * The value is an empty array when the type is not "custom".
		 * @memberOf Oscillator#
		 * @type {Array}
		 * @name partials
		 * @example
		 * osc.partials = [1, 0.2, 0.01];
		 */
		Object.defineProperty(Oscillator.prototype, "partials", {
			get : function(){
				if (this._type !== Oscillator.Type.Custom){
					return [];
				} else {
					return this._partials;
				}
			},
			set : function(partials){
				this._partials = partials;
				this.type = Oscillator.Type.Custom;
			}
		});

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf Oscillator#
		 * @type {Degrees}
		 * @name phase
		 * @example
		 * osc.phase = 180; //flips the phase of the oscillator
		 */
		Object.defineProperty(Oscillator.prototype, "phase", {
			get : function(){
				return this._phase * (180 / Math.PI);
			},
			set : function(phase){
				this._phase = phase * Math.PI / 180;
				//reset the type
				this.type = this._type;
			}
		});

		/**
		 *  Dispose and disconnect.
		 *  @return {Oscillator} this
		 */
		Oscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			if (this._oscillator !== null){
				this._oscillator.disconnect();
				this._oscillator = null;
			}
			this._wave = null;
			this._writable(["frequency", "detune"]);
			this.frequency.dispose();
			this.frequency = null;
			this.detune.dispose();
			this.detune = null;
			this._partials = null;
			return this;
		};

	/**
		 *  @class PulseOscillator is a pulse oscillator with control over pulse width,
		 *         also known as the duty cycle. At 50% duty cycle (width = 0.5) the wave is
		 *         a square and only odd-numbered harmonics are present. At all other widths
		 *         even-numbered harmonics are present. Read more
		 *         [here](https://wigglewave.wordpress.com/2014/08/16/pulse-waveforms-and-harmonics/).
		 *
		 *  @constructor
		 *  @extends {Oscillator}
		 *  @param {Frequency} [frequency] The frequency of the oscillator
		 *  @param {NormalRange} [width] The width of the pulse
		 *  @example
		 * var pulse = new PulseOscillator("E5", 0.4).toMaster().start();
		 */
		var PulseOscillator = function(){

			var options = this.optionsObject(arguments, ["frequency", "width"], Oscillator.defaults);
			Source.call(this, options);

			/**
			 *  The width of the pulse.
			 *  @type {NormalRange}
			 *  @signal
			 */
			this.width = new Signal$1(options.width, Type.NormalRange);

			/**
			 *  gate the width amount
			 *  @type {Gain}
			 *  @private
			 */
			this._widthGate = new Gain$1();

			/**
			 *  the sawtooth oscillator
			 *  @type {Oscillator}
			 *  @private
			 */
			this._sawtooth = new Oscillator({
				frequency : options.frequency,
				detune : options.detune,
				type : "sawtooth",
				phase : options.phase
			});

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = this._sawtooth.frequency;

			/**
			 *  The detune in cents.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = this._sawtooth.detune;

			/**
			 *  Threshold the signal to turn it into a square
			 *  @type {WaveShaper}
			 *  @private
			 */
			this._thresh = new WaveShaper(function(val){
				if (val < 0){
					return -1;
				} else {
					return 1;
				}
			});

			//connections
			this._sawtooth.chain(this._thresh, this.output);
			this.width.chain(this._widthGate, this._thresh);
			this._readOnly(["width", "frequency", "detune"]);
		};

		Tone$1.extend(PulseOscillator, Oscillator);

		/**
		 *  The default parameters.
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		PulseOscillator.defaults = {
			"frequency" : 440,
			"detune" : 0,
			"phase" : 0,
			"width" : 0.2,
		};

		/**
		 *  start the oscillator
		 *  @param  {Time} time
		 *  @private
		 */
		PulseOscillator.prototype._start = function(time){
			time = this.toSeconds(time);
			this._sawtooth.start(time);
			this._widthGate.gain.setValueAtTime(1, time);
		};

		/**
		 *  stop the oscillator
		 *  @param  {Time} time
		 *  @private
		 */
		PulseOscillator.prototype._stop = function(time){
			time = this.toSeconds(time);
			this._sawtooth.stop(time);
			//the width is still connected to the output.
			//that needs to be stopped also
			this._widthGate.gain.setValueAtTime(0, time);
		};

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf PulseOscillator#
		 * @type {Degrees}
		 * @name phase
		 */
		Object.defineProperty(PulseOscillator.prototype, "phase", {
			get : function(){
				return this._sawtooth.phase;
			},
			set : function(phase){
				this._sawtooth.phase = phase;
			}
		});

		/**
		 * The type of the oscillator. Always returns "pulse".
		 * @readOnly
		 * @memberOf PulseOscillator#
		 * @type {string}
		 * @name type
		 */
		Object.defineProperty(PulseOscillator.prototype, "type", {
			get : function(){
				return "pulse";
			}
		});

		/**
		 * The partials of the waveform. Cannot set partials for this waveform type
		 * @memberOf PulseOscillator#
		 * @type {Array}
		 * @name partials
		 * @private
		 */
		Object.defineProperty(PulseOscillator.prototype, "partials", {
			get : function(){
				return [];
			}
		});

		/**
		 *  Clean up method.
		 *  @return {PulseOscillator} this
		 */
		PulseOscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			this._sawtooth.dispose();
			this._sawtooth = null;
			this._writable(["width", "frequency", "detune"]);
			this.width.dispose();
			this.width = null;
			this._widthGate.dispose();
			this._widthGate = null;
			this._thresh.dispose();
			this._thresh = null;
			this.frequency = null;
			this.detune = null;
			return this;
		};

	/**
		 *  @class  Multiply two incoming signals. Or, if a number is given in the constructor,
		 *          multiplies the incoming signal by that value.
		 *
		 *  @constructor
		 *  @extends {Signal}
		 *  @param {number=} value Constant value to multiple. If no value is provided,
		 *                         it will return the product of the first and second inputs
		 *  @example
		 * var mult = new Multiply();
		 * var sigA = new Signal(3);
		 * var sigB = new Signal(4);
		 * sigA.connect(mult, 0, 0);
		 * sigB.connect(mult, 0, 1);
		 * //output of mult is 12.
		 *  @example
		 * var mult = new Multiply(10);
		 * var sig = new Signal(2).connect(mult);
		 * //the output of mult is 20.
		 */
		var Multiply = function(value){

			this.createInsOuts(2, 0);

			/**
			 *  the input node is the same as the output node
			 *  it is also the GainNode which handles the scaling of incoming signal
			 *
			 *  @type {GainNode}
			 *  @private
			 */
			this._mult = this.input[0] = this.output = new Gain$1();

			/**
			 *  the scaling parameter
			 *  @type {AudioParam}
			 *  @private
			 */
			this._param = this.input[1] = this.output.gain;

			this._param.value = this.defaultArg(value, 0);
		};

		Tone$1.extend(Multiply, Signal$1);

		/**
		 *  clean up
		 *  @returns {Multiply} this
		 */
		Multiply.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._mult.dispose();
			this._mult = null;
			this._param = null;
			return this;
		};

	/**
		 *  @class PWMOscillator modulates the width of a PulseOscillator
		 *         at the modulationFrequency. This has the effect of continuously
		 *         changing the timbre of the oscillator by altering the harmonics
		 *         generated.
		 *
		 *  @extends {Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The starting frequency of the oscillator.
		 *  @param {Frequency} modulationFrequency The modulation frequency of the width of the pulse.
		 *  @example
		 *  var pwm = new PWMOscillator("Ab3", 0.3).toMaster().start();
		 */
		var PWMOscillator = function(){
			var options = this.optionsObject(arguments, ["frequency", "modulationFrequency"], PWMOscillator.defaults);
			Source.call(this, options);

			/**
			 *  the pulse oscillator
			 *  @type {PulseOscillator}
			 *  @private
			 */
			this._pulse = new PulseOscillator(options.modulationFrequency);
			//change the pulse oscillator type
			this._pulse._sawtooth.type = "sine";

			/**
			 *  the modulator
			 *  @type {Oscillator}
			 *  @private
			 */
			this._modulator = new Oscillator({
				"frequency" : options.frequency,
				"detune" : options.detune,
				"phase" : options.phase
			});

			/**
			 *  Scale the oscillator so it doesn't go silent
			 *  at the extreme values.
			 *  @type {Multiply}
			 *  @private
			 */
			this._scale = new Multiply(2);

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = this._modulator.frequency;

			/**
			 *  The detune of the oscillator.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = this._modulator.detune;

			/**
			 *  The modulation rate of the oscillator.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.modulationFrequency = this._pulse.frequency;

			//connections
			this._modulator.chain(this._scale, this._pulse.width);
			this._pulse.connect(this.output);
			this._readOnly(["modulationFrequency", "frequency", "detune"]);
		};

		Tone$1.extend(PWMOscillator, Oscillator);

		/**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
		PWMOscillator.defaults = {
			"frequency" : 440,
			"detune" : 0,
			"phase" : 0,
			"modulationFrequency" : 0.4,
		};

		/**
		 *  start the oscillator
		 *  @param  {Time} [time=now]
		 *  @private
		 */
		PWMOscillator.prototype._start = function(time){
			time = this.toSeconds(time);
			this._modulator.start(time);
			this._pulse.start(time);
		};

		/**
		 *  stop the oscillator
		 *  @param  {Time} time (optional) timing parameter
		 *  @private
		 */
		PWMOscillator.prototype._stop = function(time){
			time = this.toSeconds(time);
			this._modulator.stop(time);
			this._pulse.stop(time);
		};

		/**
		 * The type of the oscillator. Always returns "pwm".
		 * @readOnly
		 * @memberOf PWMOscillator#
		 * @type {string}
		 * @name type
		 */
		Object.defineProperty(PWMOscillator.prototype, "type", {
			get : function(){
				return "pwm";
			}
		});

		/**
		 * The partials of the waveform. Cannot set partials for this waveform type
		 * @memberOf PWMOscillator#
		 * @type {Array}
		 * @name partials
		 * @private
		 */
		Object.defineProperty(PWMOscillator.prototype, "partials", {
			get : function(){
				return [];
			}
		});

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf PWMOscillator#
		 * @type {number}
		 * @name phase
		 */
		Object.defineProperty(PWMOscillator.prototype, "phase", {
			get : function(){
				return this._modulator.phase;
			},
			set : function(phase){
				this._modulator.phase = phase;
			}
		});

		/**
		 *  Clean up.
		 *  @return {PWMOscillator} this
		 */
		PWMOscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			this._pulse.dispose();
			this._pulse = null;
			this._scale.dispose();
			this._scale = null;
			this._modulator.dispose();
			this._modulator = null;
			this._writable(["modulationFrequency", "frequency", "detune"]);
			this.frequency = null;
			this.detune = null;
			this.modulationFrequency = null;
			return this;
		};

	/**
		 *  @class FMOscillator
		 *
		 *  @extends {Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The starting frequency of the oscillator.
		 *  @param {String} type The type of the carrier oscillator.
		 *  @param {String} modulationType The type of the modulator oscillator.
		 *  @example
		 * //a sine oscillator frequency-modulated by a square wave
		 * var fmOsc = new FMOscillator("Ab3", "sine", "square").toMaster().start();
		 */
		var FMOscillator = function(){

			var options = this.optionsObject(arguments, ["frequency", "type", "modulationType"], FMOscillator.defaults);
			Source.call(this, options);

			/**
			 *  The carrier oscillator
			 *  @type {Oscillator}
			 *  @private
			 */
			this._carrier = new Oscillator(options.frequency, options.type);

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
			this.detune = this._carrier.detune;
			this.detune.value = options.detune;

			/**
			 *  The modulation index which is in essence the depth or amount of the modulation. In other terms it is the
			 *  ratio of the frequency of the modulating signal (mf) to the amplitude of the
			 *  modulating signal (ma) -- as in ma/mf.
			 *	@type {Positive}
			 *	@signal
			 */
			this.modulationIndex = new Multiply(options.modulationIndex);
			this.modulationIndex.units = Type.Positive;

			/**
			 *  The modulating oscillator
			 *  @type  {Oscillator}
			 *  @private
			 */
			this._modulator = new Oscillator(options.frequency, options.modulationType);

			/**
			 *  Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
			 *  A harmonicity of 1 gives both oscillators the same frequency.
			 *  Harmonicity = 2 means a change of an octave.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch the modulator an octave below carrier
			 * synth.harmonicity.value = 0.5;
			 */
			this.harmonicity = new Multiply(options.harmonicity);
			this.harmonicity.units = Type.Positive;

			/**
			 *  the node where the modulation happens
			 *  @type {Gain}
			 *  @private
			 */
			this._modulationNode = new Gain$1(0);

			//connections
			this.frequency.connect(this._carrier.frequency);
			this.frequency.chain(this.harmonicity, this._modulator.frequency);
			this.frequency.chain(this.modulationIndex, this._modulationNode);
			this._modulator.connect(this._modulationNode.gain);
			this._modulationNode.connect(this._carrier.frequency);
			this._carrier.connect(this.output);
			this.detune.connect(this._modulator.detune);

			this.phase = options.phase;

			this._readOnly(["modulationIndex", "frequency", "detune", "harmonicity"]);
		};

		Tone$1.extend(FMOscillator, Oscillator);

		/**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
		FMOscillator.defaults = {
			"frequency" : 440,
			"detune" : 0,
			"phase" : 0,
			"modulationIndex" : 2,
			"modulationType" : "square",
			"harmonicity" : 1
		};

		/**
		 *  start the oscillator
		 *  @param  {Time} [time=now]
		 *  @private
		 */
		FMOscillator.prototype._start = function(time){
			time = this.toSeconds(time);
			this._modulator.start(time);
			this._carrier.start(time);
		};

		/**
		 *  stop the oscillator
		 *  @param  {Time} time (optional) timing parameter
		 *  @private
		 */
		FMOscillator.prototype._stop = function(time){
			time = this.toSeconds(time);
			this._modulator.stop(time);
			this._carrier.stop(time);
		};

		/**
		 * The type of the carrier oscillator
		 * @memberOf FMOscillator#
		 * @type {string}
		 * @name type
		 */
		Object.defineProperty(FMOscillator.prototype, "type", {
			get : function(){
				return this._carrier.type;
			},
			set : function(type){
				this._carrier.type = type;
			}
		});

		/**
		 * The type of the modulator oscillator
		 * @memberOf FMOscillator#
		 * @type {String}
		 * @name modulationType
		 */
		Object.defineProperty(FMOscillator.prototype, "modulationType", {
			get : function(){
				return this._modulator.type;
			},
			set : function(type){
				this._modulator.type = type;
			}
		});

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf FMOscillator#
		 * @type {number}
		 * @name phase
		 */
		Object.defineProperty(FMOscillator.prototype, "phase", {
			get : function(){
				return this._carrier.phase;
			},
			set : function(phase){
				this._carrier.phase = phase;
				this._modulator.phase = phase;
			}
		});

		/**
		 * The partials of the carrier waveform. A partial represents
		 * the amplitude at a harmonic. The first harmonic is the
		 * fundamental frequency, the second is the octave and so on
		 * following the harmonic series.
		 * Setting this value will automatically set the type to "custom".
		 * The value is an empty array when the type is not "custom".
		 * @memberOf FMOscillator#
		 * @type {Array}
		 * @name partials
		 * @example
		 * osc.partials = [1, 0.2, 0.01];
		 */
		Object.defineProperty(FMOscillator.prototype, "partials", {
			get : function(){
				return this._carrier.partials;
			},
			set : function(partials){
				this._carrier.partials = partials;
			}
		});

		/**
		 *  Clean up.
		 *  @return {FMOscillator} this
		 */
		FMOscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			this._writable(["modulationIndex", "frequency", "detune", "harmonicity"]);
			this.frequency.dispose();
			this.frequency = null;
			this.detune = null;
			this.harmonicity.dispose();
			this.harmonicity = null;
			this._carrier.dispose();
			this._carrier = null;
			this._modulator.dispose();
			this._modulator = null;
			this._modulationNode.dispose();
			this._modulationNode = null;
			this.modulationIndex.dispose();
			this.modulationIndex = null;
			return this;
		};

	/**
		 *  @class AudioToGain converts an input in AudioRange [-1,1] to NormalRange [0,1].
		 *         See GainToAudio.
		 *
		 *  @extends {SignalBase}
		 *  @constructor
		 *  @example
		 *  var a2g = new AudioToGain();
		 */
		var AudioToGain = function(){

			/**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
			this._norm = this.input = this.output = new WaveShaper(function(x){
				return (x + 1) / 2;
			});
		};

		Tone$1.extend(AudioToGain, SignalBase);

		/**
		 *  clean up
		 *  @returns {AudioToGain} this
		 */
		AudioToGain.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._norm.dispose();
			this._norm = null;
			return this;
		};

	/**
		 *  @class AMOscillator
		 *
		 *  @extends {Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The starting frequency of the oscillator.
		 *  @param {String} type The type of the carrier oscillator.
		 *  @param {String} modulationType The type of the modulator oscillator.
		 *  @example
		 * //a sine oscillator frequency-modulated by a square wave
		 * var fmOsc = new AMOscillator("Ab3", "sine", "square").toMaster().start();
		 */
		var AMOscillator = function(){

			var options = this.optionsObject(arguments, ["frequency", "type", "modulationType"], AMOscillator.defaults);
			Source.call(this, options);

			/**
			 *  The carrier oscillator
			 *  @type {Oscillator}
			 *  @private
			 */
			this._carrier = new Oscillator(options.frequency, options.type);

			/**
			 *  The oscillator's frequency
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = this._carrier.frequency;

			/**
			 *  The detune control signal.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = this._carrier.detune;
			this.detune.value = options.detune;

			/**
			 *  The modulating oscillator
			 *  @type  {Oscillator}
			 *  @private
			 */
			this._modulator = new Oscillator(options.frequency, options.modulationType);

			/**
			 *  convert the -1,1 output to 0,1
			 *  @type {AudioToGain}
			 *  @private
			 */
			this._modulationScale = new AudioToGain();

			/**
			 *  Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
			 *  A harmonicity of 1 gives both oscillators the same frequency.
			 *  Harmonicity = 2 means a change of an octave.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch the modulator an octave below carrier
			 * synth.harmonicity.value = 0.5;
			 */
			this.harmonicity = new Multiply(options.harmonicity);
			this.harmonicity.units = Type.Positive;

			/**
			 *  the node where the modulation happens
			 *  @type {Gain}
			 *  @private
			 */
			this._modulationNode = new Gain$1(0);

			//connections
			this.frequency.chain(this.harmonicity, this._modulator.frequency);
			this.detune.connect(this._modulator.detune);
			this._modulator.chain(this._modulationScale, this._modulationNode.gain);
			this._carrier.chain(this._modulationNode, this.output);

			this.phase = options.phase;

			this._readOnly(["frequency", "detune", "harmonicity"]);
		};

		Tone$1.extend(AMOscillator, Oscillator);

		/**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
		AMOscillator.defaults = {
			"frequency" : 440,
			"detune" : 0,
			"phase" : 0,
			"modulationType" : "square",
			"harmonicity" : 1
		};

		/**
		 *  start the oscillator
		 *  @param  {Time} [time=now]
		 *  @private
		 */
		AMOscillator.prototype._start = function(time){
			time = this.toSeconds(time);
			this._modulator.start(time);
			this._carrier.start(time);
		};

		/**
		 *  stop the oscillator
		 *  @param  {Time} time (optional) timing parameter
		 *  @private
		 */
		AMOscillator.prototype._stop = function(time){
			time = this.toSeconds(time);
			this._modulator.stop(time);
			this._carrier.stop(time);
		};

		/**
		 * The type of the carrier oscillator
		 * @memberOf AMOscillator#
		 * @type {string}
		 * @name type
		 */
		Object.defineProperty(AMOscillator.prototype, "type", {
			get : function(){
				return this._carrier.type;
			},
			set : function(type){
				this._carrier.type = type;
			}
		});

		/**
		 * The type of the modulator oscillator
		 * @memberOf AMOscillator#
		 * @type {string}
		 * @name modulationType
		 */
		Object.defineProperty(AMOscillator.prototype, "modulationType", {
			get : function(){
				return this._modulator.type;
			},
			set : function(type){
				this._modulator.type = type;
			}
		});

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf AMOscillator#
		 * @type {number}
		 * @name phase
		 */
		Object.defineProperty(AMOscillator.prototype, "phase", {
			get : function(){
				return this._carrier.phase;
			},
			set : function(phase){
				this._carrier.phase = phase;
				this._modulator.phase = phase;
			}
		});

		/**
		 * The partials of the carrier waveform. A partial represents
		 * the amplitude at a harmonic. The first harmonic is the
		 * fundamental frequency, the second is the octave and so on
		 * following the harmonic series.
		 * Setting this value will automatically set the type to "custom".
		 * The value is an empty array when the type is not "custom".
		 * @memberOf AMOscillator#
		 * @type {Array}
		 * @name partials
		 * @example
		 * osc.partials = [1, 0.2, 0.01];
		 */
		Object.defineProperty(AMOscillator.prototype, "partials", {
			get : function(){
				return this._carrier.partials;
			},
			set : function(partials){
				this._carrier.partials = partials;
			}
		});

		/**
		 *  Clean up.
		 *  @return {AMOscillator} this
		 */
		AMOscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			this._writable(["frequency", "detune", "harmonicity"]);
			this.frequency = null;
			this.detune = null;
			this.harmonicity.dispose();
			this.harmonicity = null;
			this._carrier.dispose();
			this._carrier = null;
			this._modulator.dispose();
			this._modulator = null;
			this._modulationNode.dispose();
			this._modulationNode = null;
			this._modulationScale.dispose();
			this._modulationScale = null;
			return this;
		};

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
		var FatOscillator = function(){

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

		Tone$1.extend(FatOscillator, Oscillator);

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

	/**
		 *  @class OmniOscillator aggregates Oscillator, PulseOscillator,
		 *         PWMOscillator, FMOscillator, AMOscillator, and FatOscillator
		 *         into one class. The oscillator class can be changed by setting the `type`.
		 *         `omniOsc.type = "pwm"` will set it to the PWMOscillator. Prefixing
		 *         any of the basic types ("sine", "square4", etc.) with "fm", "am", or "fat"
		 *         will use the FMOscillator, AMOscillator or FatOscillator respectively.
		 *         For example: `omniOsc.type = "fatsawtooth"` will create set the oscillator
		 *         to a FatOscillator of type "sawtooth".
		 *
		 *  @extends {Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The initial frequency of the oscillator.
		 *  @param {String} type The type of the oscillator.
		 *  @example
		 *  var omniOsc = new OmniOscillator("C#4", "pwm");
		 */
		var OmniOscillator = function(){
			var options = this.optionsObject(arguments, ["frequency", "type"], OmniOscillator.defaults);
			Source.call(this, options);

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal(options.frequency, Type.Frequency);

			/**
			 *  The detune control
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal(options.detune, Type.Cents);

			/**
			 *  the type of the oscillator source
			 *  @type {String}
			 *  @private
			 */
			this._sourceType = undefined;

			/**
			 *  the oscillator
			 *  @type {Oscillator}
			 *  @private
			 */
			this._oscillator = null;

			//set the oscillator
			this.type = options.type;
			this._readOnly(["frequency", "detune"]);
			//set the options
			this.set(options);
		};

		Tone$1.extend(OmniOscillator, Oscillator);

		/**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
		OmniOscillator.defaults = {
			"frequency" : 440,
			"detune" : 0,
			"type" : "sine",
			"phase" : 0,
		};

		/**
		 *  @enum {String}
		 *  @private
		 */
		var OmniOscType = {
			Pulse : "PulseOscillator",
			PWM : "PWMOscillator",
			Osc : "Oscillator",
			FM : "FMOscillator",
			AM : "AMOscillator",
			Fat : "FatOscillator"
		};

		/**
		 *  start the oscillator
		 *  @param {Time} [time=now] the time to start the oscillator
		 *  @private
		 */
		OmniOscillator.prototype._start = function(time){
			this._oscillator.start(time);
		};

		/**
		 *  start the oscillator
		 *  @param {Time} [time=now] the time to start the oscillator
		 *  @private
		 */
		OmniOscillator.prototype._stop = function(time){
			this._oscillator.stop(time);
		};

		/**
		 * The type of the oscillator. Can be any of the basic types: sine, square, triangle, sawtooth. Or
		 * prefix the basic types with "fm", "am", or "fat" to use the FMOscillator, AMOscillator or FatOscillator
		 * types. The oscillator could also be set to "pwm" or "pulse". All of the parameters of the
		 * oscillator's class are accessible when the oscillator is set to that type, but throws an error
		 * when it's not.
		 *
		 * @memberOf OmniOscillator#
		 * @type {String}
		 * @name type
		 * @example
		 * omniOsc.type = "pwm";
		 * //modulationFrequency is parameter which is available
		 * //only when the type is "pwm".
		 * omniOsc.modulationFrequency.value = 0.5;
		 * @example
		 * //an square wave frequency modulated by a sawtooth
		 * omniOsc.type = "fmsquare";
		 * omniOsc.modulationType = "sawtooth";
		 */
		Object.defineProperty(OmniOscillator.prototype, "type", {
			get : function(){
				var prefix = "";
				if (this._sourceType === OmniOscType.FM){
					prefix = "fm";
				} else if (this._sourceType === OmniOscType.AM){
					prefix = "am";
				} else if (this._sourceType === OmniOscType.Fat){
					prefix = "fat";
				}
				return prefix + this._oscillator.type;
			},
			set : function(type){
				if (type.substr(0, 2) === "fm"){
					this._createNewOscillator(OmniOscType.FM);
					this._oscillator.type = type.substr(2);
				} else if (type.substr(0, 2) === "am"){
					this._createNewOscillator(OmniOscType.AM);
					this._oscillator.type = type.substr(2);
				} else if (type.substr(0, 3) === "fat"){
					this._createNewOscillator(OmniOscType.Fat);
					this._oscillator.type = type.substr(3);
				} else if (type === "pwm"){
					this._createNewOscillator(OmniOscType.PWM);
				} else if (type === "pulse"){
					this._createNewOscillator(OmniOscType.Pulse);
				} else {
					this._createNewOscillator(OmniOscType.Osc);
					this._oscillator.type = type;
				}
			}
		});

		/**
		 * The partials of the waveform. A partial represents
		 * the amplitude at a harmonic. The first harmonic is the
		 * fundamental frequency, the second is the octave and so on
		 * following the harmonic series.
		 * Setting this value will automatically set the type to "custom".
		 * The value is an empty array when the type is not "custom".
		 * This is not available on "pwm" and "pulse" oscillator types.
		 * @memberOf OmniOscillator#
		 * @type {Array}
		 * @name partials
		 * @example
		 * osc.partials = [1, 0.2, 0.01];
		 */
		Object.defineProperty(OmniOscillator.prototype, "partials", {
			get : function(){
				return this._oscillator.partials;
			},
			set : function(partials){
				this._oscillator.partials = partials;
			}
		});

		/**
		 *  Set a member/attribute of the oscillator.
		 *  @param {Object|String} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {OmniOscillator} this
		 */
		OmniOscillator.prototype.set = function(params, value){
			//make sure the type is set first
			if (params === "type"){
				this.type = value;
			} else if (this.isObject(params) && params.hasOwnProperty("type")){
				this.type = params.type;
			}
			//then set the rest
			Tone$1.prototype.set.apply(this, arguments);
			return this;
		};

		/**
		 *  connect the oscillator to the frequency and detune signals
		 *  @private
		 */
		OmniOscillator.prototype._createNewOscillator = function(oscType){
			if (oscType !== this._sourceType){
				this._sourceType = oscType;
				var OscillatorConstructor = Tone$1[oscType];
				//short delay to avoid clicks on the change
				var now = this.now() + this.blockTime;
				if (this._oscillator !== null){
					var oldOsc = this._oscillator;
					oldOsc.stop(now);
					//dispose the old one
					setTimeout(function(){
						oldOsc.dispose();
						oldOsc = null;
					}, this.blockTime * 1000);
				}
				this._oscillator = new OscillatorConstructor();
				this.frequency.connect(this._oscillator.frequency);
				this.detune.connect(this._oscillator.detune);
				this._oscillator.connect(this.output);
				if (this.state === State.Started){
					this._oscillator.start(now);
				}
			}
		};

		/**
		 * The phase of the oscillator in degrees.
		 * @memberOf OmniOscillator#
		 * @type {Degrees}
		 * @name phase
		 */
		Object.defineProperty(OmniOscillator.prototype, "phase", {
			get : function(){
				return this._oscillator.phase;
			},
			set : function(phase){
				this._oscillator.phase = phase;
			}
		});

		/**
		 * The width of the oscillator (only if the oscillator is set to "pulse")
		 * @memberOf OmniOscillator#
		 * @type {NormalRange}
		 * @signal
		 * @name width
		 * @example
		 * var omniOsc = new OmniOscillator(440, "pulse");
		 * //can access the width attribute only if type === "pulse"
		 * omniOsc.width.value = 0.2;
		 */
		Object.defineProperty(OmniOscillator.prototype, "width", {
			get : function(){
				if (this._sourceType === OmniOscType.Pulse){
					return this._oscillator.width;
				}
			}
		});

		/**
		 * The number of detuned oscillators
		 * @memberOf OmniOscillator#
		 * @type {Number}
		 * @name count
		 */
		Object.defineProperty(OmniOscillator.prototype, "count", {
			get : function(){
				if (this._sourceType === OmniOscType.Fat){
					return this._oscillator.count;
				}
			},
			set : function(count){
				if (this._sourceType === OmniOscType.Fat){
					this._oscillator.count = count;
				}
			}
		});

		/**
		 * The detune spread between the oscillators. If "count" is
		 * set to 3 oscillators and the "spread" is set to 40,
		 * the three oscillators would be detuned like this: [-20, 0, 20]
		 * for a total detune spread of 40 cents. See FatOscillator
		 * for more info.
		 * @memberOf OmniOscillator#
		 * @type {Cents}
		 * @name spread
		 */
		Object.defineProperty(OmniOscillator.prototype, "spread", {
			get : function(){
				if (this._sourceType === OmniOscType.Fat){
					return this._oscillator.spread;
				}
			},
			set : function(spread){
				if (this._sourceType === OmniOscType.Fat){
					this._oscillator.spread = spread;
				}
			}
		});

		/**
		 * The type of the modulator oscillator. Only if the oscillator
		 * is set to "am" or "fm" types. see. AMOscillator or FMOscillator
		 * for more info.
		 * @memberOf OmniOscillator#
		 * @type {String}
		 * @name modulationType
		 */
		Object.defineProperty(OmniOscillator.prototype, "modulationType", {
			get : function(){
				if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
					return this._oscillator.modulationType;
				}
			},
			set : function(mType){
				if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
					this._oscillator.modulationType = mType;
				}
			}
		});

		/**
		 * The modulation index which is in essence the depth or amount of the modulation. In other terms it is the
		 * ratio of the frequency of the modulating signal (mf) to the amplitude of the
		 * modulating signal (ma) -- as in ma/mf.
		 * See FMOscillator for more info.
		 * @type {Positive}
		 * @signal
		 * @name modulationIndex
		 */
		Object.defineProperty(OmniOscillator.prototype, "modulationIndex", {
			get : function(){
				if (this._sourceType === OmniOscType.FM){
					return this._oscillator.modulationIndex;
				}
			}
		});

		/**
		 *  Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
		 *  A harmonicity of 1 gives both oscillators the same frequency.
		 *  Harmonicity = 2 means a change of an octave. See AMOscillator or FMOscillator
		 *  for more info.
		 *  @memberOf OmniOscillator#
		 *  @signal
		 *  @type {Positive}
		 *  @name harmonicity
		 */
		Object.defineProperty(OmniOscillator.prototype, "harmonicity", {
			get : function(){
				if (this._sourceType === OmniOscType.FM || this._sourceType === OmniOscType.AM){
					return this._oscillator.harmonicity;
				}
			}
		});

		/**
		 * The modulationFrequency Signal of the oscillator
		 * (only if the oscillator type is set to pwm). See
		 * PWMOscillator for more info.
		 * @memberOf OmniOscillator#
		 * @type {Frequency}
		 * @signal
		 * @name modulationFrequency
		 * @example
		 * var omniOsc = new OmniOscillator(440, "pwm");
		 * //can access the modulationFrequency attribute only if type === "pwm"
		 * omniOsc.modulationFrequency.value = 0.2;
		 */
		Object.defineProperty(OmniOscillator.prototype, "modulationFrequency", {
			get : function(){
				if (this._sourceType === OmniOscType.PWM){
					return this._oscillator.modulationFrequency;
				}
			}
		});

		/**
		 *  Clean up.
		 *  @return {OmniOscillator} this
		 */
		OmniOscillator.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			this._writable(["frequency", "detune"]);
			this.detune.dispose();
			this.detune = null;
			this.frequency.dispose();
			this.frequency = null;
			this._oscillator.dispose();
			this._oscillator = null;
			this._sourceType = null;
			return this;
		};

	/**
		 *  @class  Base-class for all instruments
		 *
		 *  @constructor
		 *  @extends {Tone}
		 */
		var Instrument$1 = function(options){

			//get the defaults
			options = this.defaultArg(options, Instrument$1.defaults);

			/**
			 *  The output and volume triming node
			 *  @type  {Volume}
			 *  @private
			 */
			this._volume = this.output = new Volume(options.volume);

			/**
			 * The volume of the output in decibels.
			 * @type {Decibels}
			 * @signal
			 * @example
			 * source.volume.value = -6;
			 */
			this.volume = this._volume.volume;
			this._readOnly("volume");
		};

		Tone$1.extend(Instrument$1);

		/**
		 *  the default attributes
		 *  @type {object}
		 */
		Instrument$1.defaults = {
			/** the volume of the output in decibels */
			"volume" : 0
		};

		/**
		 *  @abstract
		 *  @param {string|number} note the note to trigger
		 *  @param {Time} [time=now] the time to trigger the ntoe
		 *  @param {number} [velocity=1] the velocity to trigger the note
		 */
		Instrument$1.prototype.triggerAttack = Tone$1.noOp;

		/**
		 *  @abstract
		 *  @param {Time} [time=now] when to trigger the release
		 */
		Instrument$1.prototype.triggerRelease = Tone$1.noOp;

		/**
		 *  Trigger the attack and then the release after the duration.
		 *  @param  {Frequency} note     The note to trigger.
		 *  @param  {Time} duration How long the note should be held for before
		 *                          triggering the release.
		 *  @param {Time} [time=now]  When the note should be triggered.
		 *  @param  {NormalRange} [velocity=1] The velocity the note should be triggered at.
		 *  @returns {Instrument} this
		 *  @example
		 * //trigger "C4" for the duration of an 8th note
		 * synth.triggerAttackRelease("C4", "8n");
		 */
		Instrument$1.prototype.triggerAttackRelease = function(note, duration, time, velocity){
			if (this.isUndef(time)){
				time = this.now() + this.blockTime;
			} else {
				time = this.toSeconds(time);
			}
			duration = this.toSeconds(duration);
			this.triggerAttack(note, time, velocity);
			this.triggerRelease(time + duration);
			return this;
		};

		/**
		 *  clean up
		 *  @returns {Instrument} this
		 */
		Instrument$1.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._volume.dispose();
			this._volume = null;
			this._writable(["volume"]);
			this.volume = null;
			return this;
		};

	/**
		 *  @class  This is an abstract base class for other monophonic instruments to
		 *          extend. IMPORTANT: It does not make any sound on its own and
		 *          shouldn't be directly instantiated.
		 *
		 *  @constructor
		 *  @abstract
		 *  @extends {Instrument}
		 */
		var Monophonic = function(options){

			//get the defaults
			options = this.defaultArg(options, Monophonic.defaults);

			Instrument$1.call(this, options);

			/**
			 *  The glide time between notes.
			 *  @type {Time}
			 */
			this.portamento = options.portamento;
		};

		Tone$1.extend(Monophonic, Instrument$1);

		/**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		Monophonic.defaults = {
			"portamento" : 0
		};

		/**
		 *  Trigger the attack of the note optionally with a given velocity.
		 *
		 *
		 *  @param  {Frequency} note     The note to trigger.
		 *  @param  {Time} [time=now]     When the note should start.
		 *  @param  {number} [velocity=1] velocity The velocity scaler
		 *                                determines how "loud" the note
		 *                                will be triggered.
		 *  @returns {Monophonic} this
		 *  @example
		 * synth.triggerAttack("C4");
		 *  @example
		 * //trigger the note a half second from now at half velocity
		 * synth.triggerAttack("C4", "+0.5", 0.5);
		 */
		Monophonic.prototype.triggerAttack = function(note, time, velocity) {
			if (this.isUndef(time)){
				time = this.now() + this.blockTime;
			} else {
				time = this.toSeconds(time);
			}
			this._triggerEnvelopeAttack(time, velocity);
			this.setNote(note, time);
			return this;
		};

		/**
		 *  Trigger the release portion of the envelope
		 *  @param  {Time} [time=now] If no time is given, the release happens immediatly
		 *  @returns {Monophonic} this
		 *  @example
		 * synth.triggerRelease();
		 */
		Monophonic.prototype.triggerRelease = function(time){
			if (this.isUndef(time)){
				time = this.now() + this.blockTime;
			} else {
				time = this.toSeconds(time);
			}
			this._triggerEnvelopeRelease(time);
			return this;
		};

		/**
		 *  override this method with the actual method
		 *  @abstract
		 *  @private
		 */
		Monophonic.prototype._triggerEnvelopeAttack = function() {};

		/**
		 *  override this method with the actual method
		 *  @abstract
		 *  @private
		 */
		Monophonic.prototype._triggerEnvelopeRelease = function() {};

		/**
		 *  Set the note at the given time. If no time is given, the note
		 *  will set immediately.
		 *  @param {Frequency} note The note to change to.
		 *  @param  {Time} [time=now] The time when the note should be set.
		 *  @returns {Monophonic} this
		 * @example
		 * //change to F#6 in one quarter note from now.
		 * synth.setNote("F#6", "+4n");
		 * @example
		 * //change to Bb4 right now
		 * synth.setNote("Bb4");
		 */
		Monophonic.prototype.setNote = function(note, time){
			time = this.toSeconds(time);
			if (this.portamento > 0){
				var currentNote = this.frequency.value;
				this.frequency.setValueAtTime(currentNote, time);
				var portTime = this.toSeconds(this.portamento);
				this.frequency.exponentialRampToValueAtTime(note, time + portTime);
			} else {
				this.frequency.setValueAtTime(note, time);
			}
			return this;
		};

	/**
		 *  @class  Synth is composed simply of a OmniOscillator
		 *          routed through a AmplitudeEnvelope.
		 *          <img src="https://docs.google.com/drawings/d/1-1_0YW2Z1J2EPI36P8fNCMcZG7N1w1GZluPs4og4evo/pub?w=1163&h=231">
		 *
		 *  @constructor
		 *  @extends {Monophonic}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 *  @example
		 * var synth = new Synth().toMaster();
		 * synth.triggerAttackRelease("C4", "8n");
		 */
		var Synth = function(options){

			//get the defaults
			options = this.defaultArg(options, Synth.defaults);
			Monophonic.call(this, options);

			/**
			 *  The oscillator.
			 *  @type {OmniOscillator}
			 */
			this.oscillator = new OmniOscillator(options.oscillator);

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = this.oscillator.frequency;

			/**
			 *  The detune control.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = this.oscillator.detune;

			/**
			 *  The amplitude envelope.
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = new AmplitudeEnvelope$1(options.envelope);

			//connect the oscillators to the output
			this.oscillator.chain(this.envelope, this.output);
			//start the oscillators
			this.oscillator.start();
			this._readOnly(["oscillator", "frequency", "detune", "envelope"]);
		};

		Tone$1.extend(Synth, Monophonic);

		/**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
		Synth.defaults = {
			"oscillator" : {
				"type" : "triangle"
			},
			"envelope" : {
				"attack" : 0.005,
				"decay" : 0.1,
				"sustain" : 0.3,
				"release" : 1
			}
		};

		/**
		 *  start the attack portion of the envelope
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {number} [velocity=1] the velocity of the note (0-1)
		 *  @returns {Synth} this
		 *  @private
		 */
		Synth.prototype._triggerEnvelopeAttack = function(time, velocity){
			//the envelopes
			this.envelope.triggerAttack(time, velocity);
			return this;
		};

		/**
		 *  start the release portion of the envelope
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {Synth} this
		 *  @private
		 */
		Synth.prototype._triggerEnvelopeRelease = function(time){
			this.envelope.triggerRelease(time);
			return this;
		};


		/**
		 *  clean up
		 *  @returns {Synth} this
		 */
		Synth.prototype.dispose = function(){
			Monophonic.prototype.dispose.call(this);
			this._writable(["oscillator", "frequency", "detune", "envelope"]);
			this.oscillator.dispose();
			this.oscillator = null;
			this.envelope.dispose();
			this.envelope = null;
			this.frequency = null;
			this.detune = null;
			return this;
		};

	/**
		 *  @class  AMSynth uses the output of one Synth to modulate the
		 *          amplitude of another Synth. The harmonicity (the ratio between
		 *          the two signals) affects the timbre of the output signal greatly.
		 *          Read more about Amplitude Modulation Synthesis on
		 *          [SoundOnSound](http://www.soundonsound.com/sos/mar00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1TQu8Ed4iFr1YTLKpB3U1_hur-UwBrh5gdBXc8BxfGKw/pub?w=1009&h=457">
		 *
		 *  @constructor
		 *  @extends {Monophonic}
		 *  @param {Object} [options] the options available for the synth
		 *                            see defaults below
		 *  @example
		 * var synth = new AMSynth().toMaster();
		 * synth.triggerAttackRelease("C4", "4n");
		 */
		var AMSynth = function(options){

			options = this.defaultArg(options, AMSynth.defaults);
			Monophonic.call(this, options);

			/**
			 *  The carrier voice.
			 *  @type {Synth}
			 *  @private
			 */
			this._carrier = new Synth();
			this._carrier.volume.value = -10;

			/**
			 *  The carrier's oscillator
			 *  @type {Oscillator}
			 */
			this.oscillator = this._carrier.oscillator;

			/**
			 *  The carrier's envelope
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = this._carrier.envelope.set(options.envelope);

			/**
			 *  The modulator voice.
			 *  @type {Synth}
			 *  @private
			 */
			this._modulator = new Synth();
			this._modulator.volume.value = -10;

			/**
			 *  The modulator's oscillator which is applied
			 *  to the amplitude of the oscillator
			 *  @type {Oscillator}
			 */
			this.modulation = this._modulator.oscillator.set(options.modulation);

			/**
			 *  The modulator's envelope
			 *  @type {AmplitudeEnvelope}
			 */
			this.modulationEnvelope = this._modulator.envelope.set(options.modulationEnvelope);

			/**
			 *  The frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal$1(440, Type.Frequency);

			/**
			 *  The detune in cents
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal$1(options.detune, Type.Cents);

			/**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * synth.harmonicity.value = 0.5;
			 */
			this.harmonicity = new Multiply(options.harmonicity);
			this.harmonicity.units = Type.Positive;

			/**
			 *  convert the -1,1 output to 0,1
			 *  @type {AudioToGain}
			 *  @private
			 */
			this._modulationScale = new AudioToGain();

			/**
			 *  the node where the modulation happens
			 *  @type {Gain}
			 *  @private
			 */
			this._modulationNode = new Gain$1();

			//control the two voices frequency
			this.frequency.connect(this._carrier.frequency);
			this.frequency.chain(this.harmonicity, this._modulator.frequency);
			this.detune.fan(this._carrier.detune, this._modulator.detune);
			this._modulator.chain(this._modulationScale, this._modulationNode.gain);
			this._carrier.chain(this._modulationNode, this.output);
			this._readOnly(["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
		};

		Tone$1.extend(AMSynth, Monophonic);

		/**
		 *  @static
		 *  @type {Object}
		 */
		AMSynth.defaults = {
			"harmonicity" : 3,
			"detune" : 0,
			"oscillator" : {
				"type" : "sine"
			},
			"envelope" : {
				"attack" : 0.01,
				"decay" : 0.01,
				"sustain" : 1,
				"release" : 0.5
			},
			"modulation" : {
				"type" : "square"
			},
			"modulationEnvelope" : {
				"attack" : 0.5,
				"decay" : 0.0,
				"sustain" : 1,
				"release" : 0.5
			}
		};

		/**
		 *  trigger the attack portion of the note
		 *
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {NormalRange} [velocity=1] the velocity of the note
		 *  @private
		 *  @returns {AMSynth} this
		 */
		AMSynth.prototype._triggerEnvelopeAttack = function(time, velocity){
			//the port glide
			time = this.toSeconds(time);
			//the envelopes
			this.envelope.triggerAttack(time, velocity);
			this.modulationEnvelope.triggerAttack(time, velocity);
			return this;
		};

		/**
		 *  trigger the release portion of the note
		 *
		 *  @param  {Time} [time=now] the time the note will release
		 *  @private
		 *  @returns {AMSynth} this
		 */
		AMSynth.prototype._triggerEnvelopeRelease = function(time){
			this.envelope.triggerRelease(time);
			this.modulationEnvelope.triggerRelease(time);
			return this;
		};

		/**
		 *  clean up
		 *  @returns {AMSynth} this
		 */
		AMSynth.prototype.dispose = function(){
			Monophonic.prototype.dispose.call(this);
			this._writable(["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
			this._carrier.dispose();
			this._carrier = null;
			this._modulator.dispose();
			this._modulator = null;
			this.frequency.dispose();
			this.frequency = null;
			this.detune.dispose();
			this.detune = null;
			this.harmonicity.dispose();
			this.harmonicity = null;
			this._modulationScale.dispose();
			this._modulationScale = null;
			this._modulationNode.dispose();
			this._modulationNode = null;
			this.oscillator = null;
			this.envelope = null;
			this.modulationEnvelope = null;
			this.modulation = null;
			return this;
		};

	/**
		 *  @class Add a signal and a number or two signals. When no value is
		 *         passed into the constructor, Add will sum <code>input[0]</code>
		 *         and <code>input[1]</code>. If a value is passed into the constructor,
		 *         the it will be added to the input.
		 *
		 *  @constructor
		 *  @extends {Signal}
		 *  @param {number=} value If no value is provided, Add will sum the first
		 *                         and second inputs.
		 *  @example
		 * var signal = new Signal(2);
		 * var add = new Add(2);
		 * signal.connect(add);
		 * //the output of add equals 4
		 *  @example
		 * //if constructed with no arguments
		 * //it will add the first and second inputs
		 * var add = new Add();
		 * var sig0 = new Signal(3).connect(add, 0, 0);
		 * var sig1 = new Signal(4).connect(add, 0, 1);
		 * //the output of add equals 7.
		 */
		var Add = function(value){

			this.createInsOuts(2, 0);

			/**
			 *  the summing node
			 *  @type {GainNode}
			 *  @private
			 */
			this._sum = this.input[0] = this.input[1] = this.output = new Gain$1();

			/**
			 *  @private
			 *  @type {Signal}
			 */
			this._param = this.input[1] = new Signal$1(value);

			this._param.connect(this._sum);
		};

		Tone$1.extend(Add, Signal$1);

		/**
		 *  Clean up.
		 *  @returns {Add} this
		 */
		Add.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._sum.dispose();
			this._sum = null;
			this._param.dispose();
			this._param = null;
			return this;
		};

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
		var Scale = function(outputMin, outputMax){

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

		Tone$1.extend(Scale, SignalBase);

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
			Tone$1.prototype.dispose.call(this);
			this._add.dispose();
			this._add = null;
			this._scale.dispose();
			this._scale = null;
			return this;
		};

	/**
		 *  @class ScaledEnvelop is an envelope which can be scaled
		 *         to any range. It's useful for applying an envelope
		 *         to a frequency or any other non-NormalRange signal
		 *         parameter.
		 *
		 *  @extends {Envelope}
		 *  @constructor
		 *  @param {Time|Object} [attack]	the attack time in seconds
		 *  @param {Time} [decay]	the decay time in seconds
		 *  @param {number} [sustain] 	a percentage (0-1) of the full amplitude
		 *  @param {Time} [release]	the release time in seconds
		 *  @example
		 *  var scaledEnv = new ScaledEnvelope({
		 *  	"attack" : 0.2,
		 *  	"min" : 200,
		 *  	"max" : 2000
		 *  });
		 *  scaledEnv.connect(oscillator.frequency);
		 */
		var ScaledEnvelope = function(){

			//get all of the defaults
			var options = this.optionsObject(arguments, ["attack", "decay", "sustain", "release"], Envelope$1.defaults);
			Envelope$1.call(this, options);
			options = this.defaultArg(options, ScaledEnvelope.defaults);

			/**
			 *  scale the incoming signal by an exponent
			 *  @type {Pow}
			 *  @private
			 */
			this._exp = this.output = new Pow(options.exponent);

			/**
			 *  scale the signal to the desired range
			 *  @type {Multiply}
			 *  @private
			 */
			this._scale = this.output = new Scale(options.min, options.max);

			this._sig.chain(this._exp, this._scale);
		};

		Tone$1.extend(ScaledEnvelope, Envelope$1);

		/**
		 *  the default parameters
		 *  @static
		 */
		ScaledEnvelope.defaults = {
			"min" : 0,
			"max" : 1,
			"exponent" : 1
		};

		/**
		 * The envelope's min output value. This is the value which it
		 * starts at.
		 * @memberOf ScaledEnvelope#
		 * @type {number}
		 * @name min
		 */
		Object.defineProperty(ScaledEnvelope.prototype, "min", {
			get : function(){
				return this._scale.min;
			},
			set : function(min){
				this._scale.min = min;
			}
		});

		/**
		 * The envelope's max output value. In other words, the value
		 * at the peak of the attack portion of the envelope.
		 * @memberOf ScaledEnvelope#
		 * @type {number}
		 * @name max
		 */
		Object.defineProperty(ScaledEnvelope.prototype, "max", {
			get : function(){
				return this._scale.max;
			},
			set : function(max){
				this._scale.max = max;
			}
		});

		/**
		 * The envelope's exponent value.
		 * @memberOf ScaledEnvelope#
		 * @type {number}
		 * @name exponent
		 */
		Object.defineProperty(ScaledEnvelope.prototype, "exponent", {
			get : function(){
				return this._exp.value;
			},
			set : function(exp){
				this._exp.value = exp;
			}
		});

		/**
		 *  clean up
		 *  @returns {ScaledEnvelope} this
		 */
		ScaledEnvelope.prototype.dispose = function(){
			Envelope$1.prototype.dispose.call(this);
			this._scale.dispose();
			this._scale = null;
			this._exp.dispose();
			this._exp = null;
			return this;
		};

	/**
		 *  @class FrequencyEnvelope is a ScaledEnvelope, but instead of `min` and `max`
		 *         it's got a `baseFrequency` and `octaves` parameter.
		 *
		 *  @extends {Envelope}
		 *  @constructor
		 *  @param {Time|Object} [attack]	the attack time in seconds
		 *  @param {Time} [decay]	the decay time in seconds
		 *  @param {number} [sustain] 	a percentage (0-1) of the full amplitude
		 *  @param {Time} [release]	the release time in seconds
		 *  @example
		 *  var env = new FrequencyEnvelope({
		 *  	"attack" : 0.2,
		 *  	"baseFrequency" : "C2",
		 *  	"octaves" : 4
		 *  });
		 *  scaledEnv.connect(oscillator.frequency);
		 */
		var FrequencyEnvelope = function(){

			var options = this.optionsObject(arguments, ["attack", "decay", "sustain", "release"], Envelope$1.defaults);
			ScaledEnvelope.call(this, options);
			options = this.defaultArg(options, FrequencyEnvelope.defaults);

			/**
			 *  Stores the octave value
			 *  @type {Positive}
			 *  @private
			 */
			this._octaves = options.octaves;

			//setup
			this.baseFrequency = options.baseFrequency;
			this.octaves = options.octaves;
		};

		Tone$1.extend(FrequencyEnvelope, Envelope$1);

		/**
		 *  the default parameters
		 *  @static
		 */
		FrequencyEnvelope.defaults = {
			"baseFrequency" : 200,
			"octaves" : 4,
			"exponent" : 2
		};

		/**
		 * The envelope's mininum output value. This is the value which it
		 * starts at.
		 * @memberOf FrequencyEnvelope#
		 * @type {Frequency}
		 * @name baseFrequency
		 */
		Object.defineProperty(FrequencyEnvelope.prototype, "baseFrequency", {
			get : function(){
				return this._scale.min;
			},
			set : function(min){
				this._scale.min = this.toFrequency(min);
				//also update the octaves
				this.octaves = this._octaves;
			}
		});

		/**
		 * The number of octaves above the baseFrequency that the
		 * envelope will scale to.
		 * @memberOf FrequencyEnvelope#
		 * @type {Positive}
		 * @name octaves
		 */
		Object.defineProperty(FrequencyEnvelope.prototype, "octaves", {
			get : function(){
				return this._octaves;
			},
			set : function(octaves){
				this._octaves = octaves;
				this._scale.max = this.baseFrequency * Math.pow(2, octaves);
			}
		});

		/**
		 * The envelope's exponent value.
		 * @memberOf FrequencyEnvelope#
		 * @type {number}
		 * @name exponent
		 */
		Object.defineProperty(FrequencyEnvelope.prototype, "exponent", {
			get : function(){
				return this._exp.value;
			},
			set : function(exp){
				this._exp.value = exp;
			}
		});

		/**
		 *  clean up
		 *  @returns {FrequencyEnvelope} this
		 */
		FrequencyEnvelope.prototype.dispose = function(){
			ScaledEnvelope.prototype.dispose.call(this);
			return this;
		};

	/**
		 *  @class  Filter is a filter which allows for all of the same native methods
		 *          as the [BiquadFilterNode](http://webaudio.github.io/web-audio-api/#the-biquadfilternode-interface).
		 *          Filter has the added ability to set the filter rolloff at -12
		 *          (default), -24 and -48.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {Frequency|Object} [frequency] The cutoff frequency of the filter.
		 *  @param {string=} type The type of filter.
		 *  @param {number=} rolloff The drop in decibels per octave after the cutoff frequency.
		 *                            3 choices: -12, -24, and -48
		 *  @example
		 *  var filter = new Filter(200, "highpass");
		 */
		var Filter = function(){
			this.createInsOuts(1, 1);

			var options = this.optionsObject(arguments, ["frequency", "type", "rolloff"], Filter.defaults);

			/**
			 *  the filter(s)
			 *  @type {Array}
			 *  @private
			 */
			this._filters = [];

			/**
			 *  The cutoff frequency of the filter.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal$1(options.frequency, Type.Frequency);

			/**
			 *  The detune parameter
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal$1(0, Type.Cents);

			/**
			 *  The gain of the filter, only used in certain filter types
			 *  @type {Number}
			 *  @signal
			 */
			this.gain = new Signal$1({
				"value" : options.gain,
				"convert" : false
			});

			/**
			 *  The Q or Quality of the filter
			 *  @type {Positive}
			 *  @signal
			 */
			this.Q = new Signal$1(options.Q);

			/**
			 *  the type of the filter
			 *  @type {string}
			 *  @private
			 */
			this._type = options.type;

			/**
			 *  the rolloff value of the filter
			 *  @type {number}
			 *  @private
			 */
			this._rolloff = options.rolloff;

			//set the rolloff;
			this.rolloff = options.rolloff;
			this._readOnly(["detune", "frequency", "gain", "Q"]);
		};

		Tone$1.extend(Filter);

		/**
		 *  the default parameters
		 *
		 *  @static
		 *  @type {Object}
		 */
		Filter.defaults = {
			"type" : "lowpass",
			"frequency" : 350,
			"rolloff" : -12,
			"Q" : 1,
			"gain" : 0,
		};

		/**
		 * The type of the filter. Types: "lowpass", "highpass",
		 * "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking".
		 * @memberOf Filter#
		 * @type {string}
		 * @name type
		 */
		Object.defineProperty(Filter.prototype, "type", {
			get : function(){
				return this._type;
			},
			set : function(type){
				var types = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "notch", "allpass", "peaking"];
				if (types.indexOf(type)=== -1){
					throw new TypeError("Filter: invalid type "+type);
				}
				this._type = type;
				for (var i = 0; i < this._filters.length; i++){
					this._filters[i].type = type;
				}
			}
		});

		/**
		 * The rolloff of the filter which is the drop in db
		 * per octave. Implemented internally by cascading filters.
		 * Only accepts the values -12, -24, -48 and -96.
		 * @memberOf Filter#
		 * @type {number}
		 * @name rolloff
		 */
		Object.defineProperty(Filter.prototype, "rolloff", {
			get : function(){
				return this._rolloff;
			},
			set : function(rolloff){
				rolloff = parseInt(rolloff, 10);
				var possibilities = [-12, -24, -48, -96];
				var cascadingCount = possibilities.indexOf(rolloff);
				//check the rolloff is valid
				if (cascadingCount === -1){
					throw new RangeError("Filter: rolloff can only be -12, -24, -48 or -96");
				}
				cascadingCount += 1;
				this._rolloff = rolloff;
				//first disconnect the filters and throw them away
				this.input.disconnect();
				for (var i = 0; i < this._filters.length; i++) {
					this._filters[i].disconnect();
					this._filters[i] = null;
				}
				this._filters = new Array(cascadingCount);
				for (var count = 0; count < cascadingCount; count++){
					var filter = this.context.createBiquadFilter();
					filter.type = this._type;
					this.frequency.connect(filter.frequency);
					this.detune.connect(filter.detune);
					this.Q.connect(filter.Q);
					this.gain.connect(filter.gain);
					this._filters[count] = filter;
				}
				//connect them up
				var connectionChain = [this.input].concat(this._filters).concat([this.output]);
				this.connectSeries.apply(this, connectionChain);
			}
		});

		/**
		 *  Clean up.
		 *  @return {Filter} this
		 */
		Filter.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			for (var i = 0; i < this._filters.length; i++) {
				this._filters[i].disconnect();
				this._filters[i] = null;
			}
			this._filters = null;
			this._writable(["detune", "frequency", "gain", "Q"]);
			this.frequency.dispose();
			this.Q.dispose();
			this.frequency = null;
			this.Q = null;
			this.detune.dispose();
			this.detune = null;
			this.gain.dispose();
			this.gain = null;
			return this;
		};

	/**
		 *  @class  MonoSynth is composed of one oscillator, one filter, and two envelopes.
		 *          The amplitude of the Oscillator and the cutoff frequency of the
		 *          Filter are controlled by Envelopes.
		 *          <img src="https://docs.google.com/drawings/d/1gaY1DF9_Hzkodqf8JI1Cg2VZfwSElpFQfI94IQwad38/pub?w=924&h=240">
		 *
		 *  @constructor
		 *  @extends {Monophonic}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 *  @example
		 * var synth = new MonoSynth({
		 * 	"oscillator" : {
		 * 		"type" : "square"
		 *  },
		 *  "envelope" : {
		 *  	"attack" : 0.1
		 *  }
		 * }).toMaster();
		 * synth.triggerAttackRelease("C4", "8n");
		 */
		var MonoSynth = function(options){

			//get the defaults
			options = this.defaultArg(options, MonoSynth.defaults);
			Monophonic.call(this, options);

			/**
			 *  The oscillator.
			 *  @type {OmniOscillator}
			 */
			this.oscillator = new OmniOscillator(options.oscillator);

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = this.oscillator.frequency;

			/**
			 *  The detune control.
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = this.oscillator.detune;

			/**
			 *  The filter.
			 *  @type {Filter}
			 */
			this.filter = new Filter(options.filter);

			/**
			 *  The filter envelope.
			 *  @type {FrequencyEnvelope}
			 */
			this.filterEnvelope = new FrequencyEnvelope(options.filterEnvelope);

			/**
			 *  The amplitude envelope.
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = new AmplitudeEnvelope$1(options.envelope);

			//connect the oscillators to the output
			this.oscillator.chain(this.filter, this.envelope, this.output);
			//start the oscillators
			this.oscillator.start();
			//connect the filter envelope
			this.filterEnvelope.connect(this.filter.frequency);
			this._readOnly(["oscillator", "frequency", "detune", "filter", "filterEnvelope", "envelope"]);
		};

		Tone$1.extend(MonoSynth, Monophonic);

		/**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
		MonoSynth.defaults = {
			"frequency" : "C4",
			"detune" : 0,
			"oscillator" : {
				"type" : "square"
			},
			"filter" : {
				"Q" : 6,
				"type" : "lowpass",
				"rolloff" : -24
			},
			"envelope" : {
				"attack" : 0.005,
				"decay" : 0.1,
				"sustain" : 0.9,
				"release" : 1
			},
			"filterEnvelope" : {
				"attack" : 0.06,
				"decay" : 0.2,
				"sustain" : 0.5,
				"release" : 2,
				"baseFrequency" : 200,
				"octaves" : 7,
				"exponent" : 2
			}
		};

		/**
		 *  start the attack portion of the envelope
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {NormalRange} [velocity=1] the velocity of the note (0-1)
		 *  @returns {MonoSynth} this
		 *  @private
		 */
		MonoSynth.prototype._triggerEnvelopeAttack = function(time, velocity){
			//the envelopes
			this.envelope.triggerAttack(time, velocity);
			this.filterEnvelope.triggerAttack(time);
			return this;
		};

		/**
		 *  start the release portion of the envelope
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {MonoSynth} this
		 *  @private
		 */
		MonoSynth.prototype._triggerEnvelopeRelease = function(time){
			this.envelope.triggerRelease(time);
			this.filterEnvelope.triggerRelease(time);
			return this;
		};


		/**
		 *  clean up
		 *  @returns {MonoSynth} this
		 */
		MonoSynth.prototype.dispose = function(){
			Monophonic.prototype.dispose.call(this);
			this._writable(["oscillator", "frequency", "detune", "filter", "filterEnvelope", "envelope"]);
			this.oscillator.dispose();
			this.oscillator = null;
			this.envelope.dispose();
			this.envelope = null;
			this.filterEnvelope.dispose();
			this.filterEnvelope = null;
			this.filter.dispose();
			this.filter = null;
			this.frequency = null;
			this.detune = null;
			return this;
		};

	/**
		 *  @class Zero outputs 0's at audio-rate. The reason this has to be
		 *         it's own class is that many browsers optimize out Signal
		 *         with a value of 0 and will not process nodes further down the graph.
		 *  @extends {Tone}
		 */
		var Zero = function(){

			/**
			 *  The gain node
			 *  @type  {Gain}
			 *  @private
			 */
			this._gain = this.input = this.output = new Gain$1();

			context._zeros.connect(this._gain);
		};

		Tone$1.extend(Zero);

		/**
		 *  clean up
		 *  @return  {Zero}  this
		 */
		Zero.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._gain.dispose();
			this._gain = null;
			return this;
		};

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
		var LFO$1 = function(){

			var options = this.optionsObject(arguments, ["frequency", "min", "max"], LFO$1.defaults);

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
			this.amplitude.units = Type$1.NormalRange;
			this.amplitude.value = options.amplitude;

			/**
			 *  The signal which is output when the LFO is stopped
			 *  @type  {Signal}
			 *  @private
			 */
			this._stoppedSignal = new Signal$1(0, Type$1.AudioRange);

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
			this._units = Type$1.Default;
			this.units = options.units;

			//connect it up
			this._oscillator.chain(this._a2g, this._scaler);
			this._zeros.connect(this._a2g);
			this._stoppedSignal.connect(this._a2g);
			this._readOnly(["amplitude", "frequency"]);
			this.phase = options.phase;
		};

		Tone$1.extend(LFO$1, Oscillator);

		/**
		 *  the default parameters
		 *
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		LFO$1.defaults = {
			"type" : "sine",
			"min" : 0,
			"max" : 1,
			"phase" : 0,
			"frequency" : "4n",
			"amplitude" : 1,
			"units" : Type$1.Default
		};

		/**
		 *  Start the LFO.
		 *  @param  {Time} [time=now] the time the LFO will start
		 *  @returns {LFO} this
		 */
		LFO$1.prototype.start = function(time){
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
		LFO$1.prototype.stop = function(time){
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
		LFO$1.prototype.sync = function(){
			this._oscillator.sync();
			this._oscillator.syncFrequency();
			return this;
		};

		/**
		 *  unsync the LFO from transport control
		 *  @returns {LFO} this
		 */
		LFO$1.prototype.unsync = function(){
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
		Object.defineProperty(LFO$1.prototype, "min", {
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
		Object.defineProperty(LFO$1.prototype, "max", {
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
		 Object.defineProperty(LFO$1.prototype, "type", {
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
		 Object.defineProperty(LFO$1.prototype, "phase", {
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
		 Object.defineProperty(LFO$1.prototype, "units", {
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
		Object.defineProperty(LFO$1.prototype, "mute", {
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
		Object.defineProperty(LFO$1.prototype, "state", {
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
		LFO$1.prototype.connect = function(node){
			if (node.constructor === Signal$1 || node.constructor === Param || node.constructor === TimelineSignal){
				this.convert = node.convert;
				this.units = node.units;
			}
			Signal$1.prototype.connect.apply(this, arguments);
			return this;
		};

		/**
		 *  private method borrowed from Param converts
		 *  units from their destination value
		 *  @function
		 *  @private
		 */
		LFO$1.prototype._fromUnits = Param.prototype._fromUnits;

		/**
		 *  private method borrowed from Param converts
		 *  units to their destination value
		 *  @function
		 *  @private
		 */
		LFO$1.prototype._toUnits = Param.prototype._toUnits;

		/**
		 *  disconnect and dispose
		 *  @returns {LFO} this
		 */
		LFO$1.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
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

	/**
		 *  @class  DuoSynth is a monophonic synth composed of two
		 *          MonoSynths run in parallel with control over the
		 *          frequency ratio between the two voices and vibrato effect.
		 *          <img src="https://docs.google.com/drawings/d/1bL4GXvfRMMlqS7XyBm9CjL9KJPSUKbcdBNpqOlkFLxk/pub?w=1012&h=448">
		 *
		 *  @constructor
		 *  @extends {Monophonic}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 *  @example
		 * var duoSynth = new DuoSynth().toMaster();
		 * duoSynth.triggerAttackRelease("C4", "2n");
		 */
		var DuoSynth = function(options){

			options = this.defaultArg(options, DuoSynth.defaults);
			Monophonic.call(this, options);

			/**
			 *  the first voice
			 *  @type {MonoSynth}
			 */
			this.voice0 = new MonoSynth(options.voice0);
			this.voice0.volume.value = -10;

			/**
			 *  the second voice
			 *  @type {MonoSynth}
			 */
			this.voice1 = new MonoSynth(options.voice1);
			this.voice1.volume.value = -10;

			/**
			 *  The vibrato LFO.
			 *  @type {LFO}
			 *  @private
			 */
			this._vibrato = new LFO$1(options.vibratoRate, -50, 50);
			this._vibrato.start();

			/**
			 * the vibrato frequency
			 * @type {Frequency}
			 * @signal
			 */
			this.vibratoRate = this._vibrato.frequency;

			/**
			 *  the vibrato gain
			 *  @type {Gain}
			 *  @private
			 */
			this._vibratoGain = new Gain(options.vibratoAmount, Type.Positive);

			/**
			 * The amount of vibrato
			 * @type {Positive}
			 * @signal
			 */
			this.vibratoAmount = this._vibratoGain.gain;

			/**
			 *  the frequency control
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal$1(440, Type.Frequency);

			/**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * duoSynth.harmonicity.value = 0.5;
			 */
			this.harmonicity = new Multiply(options.harmonicity);
			this.harmonicity.units = Type.Positive;

			//control the two voices frequency
			this.frequency.connect(this.voice0.frequency);
			this.frequency.chain(this.harmonicity, this.voice1.frequency);
			this._vibrato.connect(this._vibratoGain);
			this._vibratoGain.fan(this.voice0.detune, this.voice1.detune);
			this.voice0.connect(this.output);
			this.voice1.connect(this.output);
			this._readOnly(["voice0", "voice1", "frequency", "vibratoAmount", "vibratoRate"]);
		};

		Tone$1.extend(DuoSynth, Monophonic);

		/**
		 *  @static
		 *  @type {Object}
		 */
		DuoSynth.defaults = {
			"vibratoAmount" : 0.5,
			"vibratoRate" : 5,
			"harmonicity" : 1.5,
			"voice0" : {
				"volume" : -10,
				"portamento" : 0,
				"oscillator" : {
					"type" : "sine"
				},
				"filterEnvelope" : {
					"attack" : 0.01,
					"decay" : 0.0,
					"sustain" : 1,
					"release" : 0.5
				},
				"envelope" : {
					"attack" : 0.01,
					"decay" : 0.0,
					"sustain" : 1,
					"release" : 0.5
				}
			},
			"voice1" : {
				"volume" : -10,
				"portamento" : 0,
				"oscillator" : {
					"type" : "sine"
				},
				"filterEnvelope" : {
					"attack" : 0.01,
					"decay" : 0.0,
					"sustain" : 1,
					"release" : 0.5
				},
				"envelope" : {
					"attack" : 0.01,
					"decay" : 0.0,
					"sustain" : 1,
					"release" : 0.5
				}
			}
		};

		/**
		 *  start the attack portion of the envelopes
		 *
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {NormalRange} [velocity=1] the velocity of the note (0-1)
		 *  @returns {DuoSynth} this
		 *  @private
		 */
		DuoSynth.prototype._triggerEnvelopeAttack = function(time, velocity){
			time = this.toSeconds(time);
			this.voice0.envelope.triggerAttack(time, velocity);
			this.voice1.envelope.triggerAttack(time, velocity);
			this.voice0.filterEnvelope.triggerAttack(time);
			this.voice1.filterEnvelope.triggerAttack(time);
			return this;
		};

		/**
		 *  start the release portion of the envelopes
		 *
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {DuoSynth} this
		 *  @private
		 */
		DuoSynth.prototype._triggerEnvelopeRelease = function(time){
			this.voice0.triggerRelease(time);
			this.voice1.triggerRelease(time);
			return this;
		};

		/**
		 *  clean up
		 *  @returns {DuoSynth} this
		 */
		DuoSynth.prototype.dispose = function(){
			Monophonic.prototype.dispose.call(this);
			this._writable(["voice0", "voice1", "frequency", "vibratoAmount", "vibratoRate"]);
			this.voice0.dispose();
			this.voice0 = null;
			this.voice1.dispose();
			this.voice1 = null;
			this.frequency.dispose();
			this.frequency = null;
			this._vibratoGain.dispose();
			this._vibratoGain = null;
			this._vibrato = null;
			this.harmonicity.dispose();
			this.harmonicity = null;
			this.vibratoAmount.dispose();
			this.vibratoAmount = null;
			this.vibratoRate = null;
			return this;
		};

	/**
		 *  @class  FMSynth is composed of two Synths where one Synth modulates
		 *          the frequency of a second Synth. A lot of spectral content
		 *          can be explored using the modulationIndex parameter. Read more about
		 *          frequency modulation synthesis on [SoundOnSound](http://www.soundonsound.com/sos/apr00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1h0PUDZXPgi4Ikx6bVT6oncrYPLluFKy7lj53puxj-DM/pub?w=902&h=462">
		 *
		 *  @constructor
		 *  @extends {Monophonic}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 *  @example
		 * var fmSynth = new FMSynth().toMaster();
		 * fmSynth.triggerAttackRelease("C5", "4n");
		 */
		var FMSynth = function(options){

			options = this.defaultArg(options, FMSynth.defaults);
			Monophonic.call(this, options);

			/**
			 *  The carrier voice.
			 *  @type {Synth}
			 *  @private
			 */
			this._carrier = new Synth(options.carrier);
			this._carrier.volume.value = -10;


			/**
			 *  The carrier's oscillator
			 *  @type {Oscillator}
			 */
			this.oscillator = this._carrier.oscillator;

			/**
			 *  The carrier's envelope
			 *  @type {Oscillator}
			 */
			this.envelope = this._carrier.envelope.set(options.envelope);

			/**
			 *  The modulator voice.
			 *  @type {Synth}
			 *  @private
			 */
			this._modulator = new Synth(options.modulator);
			this._modulator.volume.value = -10;


			/**
			 *  The modulator's oscillator which is applied
			 *  to the amplitude of the oscillator
			 *  @type {Oscillator}
			 */
			this.modulation = this._modulator.oscillator.set(options.modulation);

			/**
			 *  The modulator's envelope
			 *  @type {Oscillator}
			 */
			this.modulationEnvelope = this._modulator.envelope.set(options.modulationEnvelope);

			/**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal$1(440, Type.Frequency);

			/**
			 *  The detune in cents
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal$1(options.detune, Type.Cents);

			/**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * synth.harmonicity.value = 0.5;
			 */
			this.harmonicity = new Multiply(options.harmonicity);
			this.harmonicity.units = Type.Positive;

			/**
			 *  The modulation index which essentially the depth or amount of the modulation. It is the
			 *  ratio of the frequency of the modulating signal (mf) to the amplitude of the
			 *  modulating signal (ma) -- as in ma/mf.
			 *	@type {Positive}
			 *	@signal
			 */
			this.modulationIndex = new Multiply(options.modulationIndex);
			this.modulationIndex.units = Type.Positive;

			/**
			 *  the node where the modulation happens
			 *  @type {GainNode}
			 *  @private
			 */
			this._modulationNode = new Gain(0);

			//control the two voices frequency
			this.frequency.connect(this._carrier.frequency);
			this.frequency.chain(this.harmonicity, this._modulator.frequency);
			this.frequency.chain(this.modulationIndex, this._modulationNode);
			this.detune.fan(this._carrier.detune, this._modulator.detune);
			this._modulator.connect(this._modulationNode.gain);
			this._modulationNode.connect(this._carrier.frequency);
			this._carrier.connect(this.output);
			this._readOnly(["frequency", "harmonicity", "modulationIndex", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
		};

		Tone$1.extend(FMSynth, Monophonic);

		/**
		 *  @static
		 *  @type {Object}
		 */
		FMSynth.defaults = {
			"harmonicity" : 3,
			"modulationIndex" : 10,
			"detune" : 0,
			"oscillator" : {
				"type" : "sine"
			},
			"envelope" : {
				"attack" : 0.01,
				"decay" : 0.01,
				"sustain" : 1,
				"release" : 0.5
			},
			"modulation" : {
				"type" : "square"
			},
			"modulationEnvelope" : {
				"attack" : 0.5,
				"decay" : 0.0,
				"sustain" : 1,
				"release" : 0.5
			}
		};

		/**
		 * 	trigger the attack portion of the note
		 *
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {number} [velocity=1] the velocity of the note
		 *  @returns {FMSynth} this
		 *  @private
		 */
		FMSynth.prototype._triggerEnvelopeAttack = function(time, velocity){
			time = this.toSeconds(time);
			//the envelopes
			this.envelope.triggerAttack(time, velocity);
			this.modulationEnvelope.triggerAttack(time);
			return this;
		};

		/**
		 *  trigger the release portion of the note
		 *
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {FMSynth} this
		 *  @private
		 */
		FMSynth.prototype._triggerEnvelopeRelease = function(time){
			time = this.toSeconds(time);
			this.envelope.triggerRelease(time);
			this.modulationEnvelope.triggerRelease(time);
			return this;
		};

		/**
		 *  clean up
		 *  @returns {FMSynth} this
		 */
		FMSynth.prototype.dispose = function(){
			Monophonic.prototype.dispose.call(this);
			this._writable(["frequency", "harmonicity", "modulationIndex", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
			this._carrier.dispose();
			this._carrier = null;
			this._modulator.dispose();
			this._modulator = null;
			this.frequency.dispose();
			this.frequency = null;
			this.detune.dispose();
			this.detune = null;
			this.modulationIndex.dispose();
			this.modulationIndex = null;
			this.harmonicity.dispose();
			this.harmonicity = null;
			this._modulationNode.dispose();
			this._modulationNode = null;
			this.oscillator = null;
			this.envelope = null;
			this.modulationEnvelope = null;
			this.modulation = null;
			return this;
		};

	/**
		 *  @class  MembraneSynth makes kick and tom sounds using a single oscillator
		 *          with an amplitude envelope and frequency ramp. A OmniOscillator
		 *          is routed through a AmplitudeEnvelope to the output. The drum
		 *          quality of the sound comes from the frequency envelope applied
		 *          during during MembraneSynth.triggerAttack(note). The frequency
		 *          envelope starts at <code>note * .octaves</code> and ramps to
		 *          <code>note</code> over the duration of <code>.pitchDecay</code>.
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 *  @example
		 * var synth = new MembraneSynth().toMaster();
		 * synth.triggerAttackRelease("C2", "8n");
		 */
		var MembraneSynth = function(options){

			options = this.defaultArg(options, MembraneSynth.defaults);
			Instrument$1.call(this, options);

			/**
			 *  The oscillator.
			 *  @type {OmniOscillator}
			 */
			this.oscillator = new OmniOscillator(options.oscillator).start();

			/**
			 *  The amplitude envelope.
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = new AmplitudeEnvelope$1(options.envelope);

			/**
			 *  The number of octaves the pitch envelope ramps.
			 *  @type {Positive}
			 */
			this.octaves = options.octaves;

			/**
			 *  The amount of time the frequency envelope takes.
			 *  @type {Time}
			 */
			this.pitchDecay = options.pitchDecay;

			this.oscillator.chain(this.envelope, this.output);
			this._readOnly(["oscillator", "envelope"]);
		};

		Tone$1.extend(MembraneSynth, Instrument$1);

		/**
		 *  @static
		 *  @type {Object}
		 */
		MembraneSynth.defaults = {
			"pitchDecay" : 0.05,
			"octaves" : 10,
			"oscillator" : {
				"type" : "sine",
			},
			"envelope" : {
				"attack" : 0.001,
				"decay" : 0.4,
				"sustain" : 0.01,
				"release" : 1.4,
				"attackCurve" : "exponential"
			}
		};

		/**
		 *  Trigger the note at the given time with the given velocity.
		 *
		 *  @param  {Frequency} note     the note
		 *  @param  {Time} [time=now]     the time, if not given is now
		 *  @param  {number} [velocity=1] velocity defaults to 1
		 *  @returns {MembraneSynth} this
		 *  @example
		 *  kick.triggerAttack(60);
		 */
		MembraneSynth.prototype.triggerAttack = function(note, time, velocity) {
			time = this.toSeconds(time);
			note = this.toFrequency(note);
			var maxNote = note * this.octaves;
			this.oscillator.frequency.setValueAtTime(maxNote, time);
			this.oscillator.frequency.exponentialRampToValueAtTime(note, time + this.toSeconds(this.pitchDecay));
			this.envelope.triggerAttack(time, velocity);
			return this;
		};

		/**
		 *  Trigger the release portion of the note.
		 *
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {MembraneSynth} this
		 */
		MembraneSynth.prototype.triggerRelease = function(time){
			this.envelope.triggerRelease(time);
			return this;
		};

		/**
		 *  Clean up.
		 *  @returns {MembraneSynth} this
		 */
		MembraneSynth.prototype.dispose = function(){
			Instrument$1.prototype.dispose.call(this);
			this._writable(["oscillator", "envelope"]);
			this.oscillator.dispose();
			this.oscillator = null;
			this.envelope.dispose();
			this.envelope = null;
			return this;
		};

	/**
		 *  Inharmonic ratio of frequencies based on the Roland TR-808
		 *  Taken from https://ccrma.stanford.edu/papers/tr-808-cymbal-physically-informed-circuit-bendable-digital-model
		 *  @private
		 *  @static
		 *  @type {Array}
		 */
		var inharmRatios = [1.0, 1.483, 1.932, 2.546, 2.630, 3.897];

		/**
		 *  @class  A highly inharmonic and spectrally complex source with a highpass filter
		 *          and amplitude envelope which is good for making metalophone sounds. Based
		 *          on CymbalSynth by [@polyrhythmatic](https://github.com/polyrhythmatic).
		 *          Inspiration from [Sound on Sound](http://www.soundonsound.com/sos/jul02/articles/synthsecrets0702.asp).
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {Object} [options] The options availble for the synth
		 *                             see defaults below
		 */
		var MetalSynth = function(options){

			options = this.defaultArg(options, MetalSynth.defaults);
			Instrument$1.call(this, options);

			/**
			 *  The frequency of the cymbal
			 *  @type  {Frequency}
			 *  @signal
			 */
			this.frequency = new Signal(options.frequency, Type.Frequency);

			/**
			 *  The array of FMOscillators
			 *  @type  {Array}
			 *  @private
			 */
			this._oscillators = [];

			/**
			 *  The frequency multipliers
			 *  @type {Array}
			 *  @private
			 */
			this._freqMultipliers = [];

			/**
			 *  The amplitude for the body
			 *  @type {Gain}
			 *  @private
			 */
			this._amplitue = new Gain$1(0).connect(this.output);

			/**
			 *  highpass the output
			 *  @type {Filter}
			 *  @private
			 */
			this._highpass = new Filter({
				"type" : "highpass",
				"Q" : -3.0102999566398125
			}).connect(this._amplitue);

			/**
			 *  The number of octaves the highpass
			 *  filter frequency ramps
			 *  @type {Number}
			 *  @private
			 */
			this._octaves = options.octaves;

			/**
			 *  Scale the body envelope
			 *  for the bandpass
			 *  @type {Scale}
			 *  @private
			 */
			this._filterFreqScaler = new Scale(options.resonance, 7000);

			/**
			 *  The envelope which is connected both to the
			 *  amplitude and highpass filter's cutoff frequency
			 *  @type  {Envelope}
			 */
			this.envelope = new Envelope({
				"attack" : options.envelope.attack,
				"attackCurve" : "linear",
				"decay" : options.envelope.decay,
				"sustain" : 0,
				"release" : options.envelope.release,
			}).chain(this._filterFreqScaler, this._highpass.frequency);
			this.envelope.connect(this._amplitue.gain);

			for (var i = 0; i < inharmRatios.length; i++){
				var osc = new FMOscillator({
					"type" : "square",
					"modulationType" : "square",
					"harmonicity" : options.harmonicity,
					"modulationIndex" : options.modulationIndex
				});
				osc.connect(this._highpass).start(0);
				this._oscillators[i] = osc;

				var mult = new Multiply(inharmRatios[i]);
				this._freqMultipliers[i] = mult;
				this.frequency.chain(mult, osc.frequency);
			}

			//set the octaves
			this.octaves = options.octaves;

		};

		Tone$1.extend(MetalSynth, Instrument$1);

		/**
		 *  default values
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		MetalSynth.defaults = {
			"frequency" : 200,
			"envelope" : {
				"attack" : 0.001,
				"decay" : 1.4,
				"release" : 0.2
			},
			"harmonicity" : 5.1,
			"modulationIndex" : 32,
			"resonance" : 4000,
			"octaves" : 1.5
		};

		/**
		 *  Trigger the attack.
		 *  @param  {Time}  time      When the attack should be triggered.
		 *  @param  {NormalRange=1}  velocity  The velocity that the envelope should be triggered at.
		 *  @return  {MetalSynth}  this
		 */
		MetalSynth.prototype.triggerAttack = function(time, vel) {
			time = this.toSeconds(time);
			vel = this.defaultArg(vel, 1);
			this.envelope.triggerAttack(time, vel);
			return this;
		};

		/**
		 *  Trigger the release of the envelope.
		 *  @param  {Time}  time      When the release should be triggered.
		 *  @return  {MetalSynth}  this
		 */
		MetalSynth.prototype.triggerRelease = function(time) {
			time = this.toSeconds(time);
			this.envelope.triggerRelease(time);
			return this;
		};

		/**
		 *  Trigger the attack and release of the envelope after the given
		 *  duration.
		 *  @param  {Time}  duration  The duration before triggering the release
		 *  @param  {Time}  time      When the attack should be triggered.
		 *  @param  {NormalRange=1}  velocity  The velocity that the envelope should be triggered at.
		 *  @return  {MetalSynth}  this
		 */
		MetalSynth.prototype.triggerAttackRelease = function(duration, time, velocity) {
			time = this.toSeconds(time);
			duration = this.toSeconds(duration);
			this.triggerAttack(time, velocity);
			this.triggerRelease(time + duration);
			return this;
		};

		/**
		 *  The modulationIndex of the oscillators which make up the source.
		 *  see FMOscillator.modulationIndex
		 *  @memberOf MetalSynth#
		 *  @type {Positive}
		 *  @name  modulationIndex
		 */
		Object.defineProperty(MetalSynth.prototype, "modulationIndex", {
			get : function(){
				return this._oscillators[0].modulationIndex.value;
			},
			set : function(val){
				for (var i = 0; i < this._oscillators.length; i++){
					this._oscillators[i].modulationIndex.value = val;
				}
			}
		});

		/**
		 *  The harmonicity of the oscillators which make up the source.
		 *  see FMOscillator.harmonicity
		 *  @memberOf MetalSynth#
		 *  @type {Positive}
		 *  @name  harmonicity
		 */
		Object.defineProperty(MetalSynth.prototype, "harmonicity", {
			get : function(){
				return this._oscillators[0].harmonicity.value;
			},
			set : function(val){
				for (var i = 0; i < this._oscillators.length; i++){
					this._oscillators[i].harmonicity.value = val;
				}
			}
		});

		/**
		 *  The frequency of the highpass filter attached to the envelope
		 *  @memberOf MetalSynth#
		 *  @type {Frequency}
		 *  @name  resonance
		 */
		Object.defineProperty(MetalSynth.prototype, "resonance", {
			get : function(){
				return this._filterFreqScaler.min;
			},
			set : function(val){
				this._filterFreqScaler.min = val;
				this.octaves = this._octaves;
			}
		});

		/**
		 *  The number of octaves above the "resonance" frequency
		 *  that the filter ramps during the attack/decay envelope
		 *  @memberOf MetalSynth#
		 *  @type {Number}
		 *  @name  octaves
		 */
		Object.defineProperty(MetalSynth.prototype, "octaves", {
			get : function(){
				return this._octaves;
			},
			set : function(octs){
				this._octaves = octs;
				this._filterFreqScaler.max = this._filterFreqScaler.min * Math.pow(2, octs);
			}
		});

		/**
		 *  Clean up
		 *  @returns {MetalSynth} this
		 */
		MetalSynth.prototype.dispose = function(){
			Instrument$1.prototype.dispose.call(this);
			for (var i = 0; i < this._oscillators.length; i++){
				this._oscillators[i].dispose();
				this._freqMultipliers[i].dispose();
			}
			this._oscillators = null;
			this._freqMultipliers = null;
			this.frequency.dispose();
			this.frequency = null;
			this._filterFreqScaler.dispose();
			this._filterFreqScaler = null;
			this._amplitue.dispose();
			this._amplitue = null;
			this.envelope.dispose();
			this.envelope = null;
			this._highpass.dispose();
			this._highpass = null;
		};

	/**
		 *  @class  Noise is a noise generator. It uses looped noise buffers to save on performance.
		 *          Noise supports the noise types: "pink", "white", and "brown". Read more about
		 *          colors of noise on [Wikipedia](https://en.wikipedia.org/wiki/Colors_of_noise).
		 *
		 *  @constructor
		 *  @extends {Source}
		 *  @param {string} type the noise type (white|pink|brown)
		 *  @example
		 * //initialize the noise and start
		 * var noise = new Noise("pink").start();
		 *
		 * //make an autofilter to shape the noise
		 * var autoFilter = new AutoFilter({
		 * 	"frequency" : "8m",
		 * 	"min" : 800,
		 * 	"max" : 15000
		 * }).connect(Master);
		 *
		 * //connect the noise
		 * noise.connect(autoFilter);
		 * //start the autofilter LFO
		 * autoFilter.start()
		 */
		var Noise = function(){

			var options = this.optionsObject(arguments, ["type"], Noise.defaults);
			Source.call(this, options);

			/**
			 *  @private
			 *  @type {AudioBufferSourceNode}
			 */
			this._source = null;

			/**
			 *  the buffer
			 *  @private
			 *  @type {AudioBuffer}
			 */
			this._buffer = null;

			/**
			 *  The playback rate of the noise. Affects
			 *  the "frequency" of the noise.
			 *  @type {Positive}
			 *  @signal
			 */
			this._playbackRate = options.playbackRate;

			this.type = options.type;
		};

		Tone$1.extend(Noise, Source);

		/**
		 *  the default parameters
		 *
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		Noise.defaults = {
			"type" : "white",
			"playbackRate" : 1
		};

		/**
		 * The type of the noise. Can be "white", "brown", or "pink".
		 * @memberOf Noise#
		 * @type {string}
		 * @name type
		 * @example
		 * noise.type = "white";
		 */
		Object.defineProperty(Noise.prototype, "type", {
			get : function(){
				if (this._buffer === _whiteNoise){
					return "white";
				} else if (this._buffer === _brownNoise){
					return "brown";
				} else if (this._buffer === _pinkNoise){
					return "pink";
				}
			},
			set : function(type){
				if (this.type !== type){
					switch (type){
						case "white" :
							this._buffer = _whiteNoise;
							break;
						case "pink" :
							this._buffer = _pinkNoise;
							break;
						case "brown" :
							this._buffer = _brownNoise;
							break;
						default :
							throw new TypeError("Noise: invalid type: "+type);
					}
					//if it's playing, stop and restart it
					if (this.state === State.Started){
						var now = this.now() + this.blockTime;
						//remove the listener
						this._stop(now);
						this._start(now);
					}
				}
			}
		});

		/**
		 *  The playback rate of the noise. Affects
		 *  the "frequency" of the noise.
		 *  @type {Positive}
		 *  @signal
		 */
		Object.defineProperty(Noise.prototype, "playbackRate", {
			get : function(){
				return this._playbackRate;
			},
			set : function(rate){
				this._playbackRate = rate;
				if (this._source) {
					this._source.playbackRate.value = rate;
				}
			}
		});

		/**
		 *  internal start method
		 *
		 *  @param {Time} time
		 *  @private
		 */
		Noise.prototype._start = function(time){
			this._source = this.context.createBufferSource();
			this._source.buffer = this._buffer;
			this._source.loop = true;
			this._source.playbackRate.value = this._playbackRate;
			this._source.connect(this.output);
			this._source.start(this.toSeconds(time), Math.random() * (this._buffer.duration - 0.001));
		};

		/**
		 *  internal stop method
		 *
		 *  @param {Time} time
		 *  @private
		 */
		Noise.prototype._stop = function(time){
			if (this._source){
				this._source.stop(this.toSeconds(time));
			}
		};

		/**
		 *  Clean up.
		 *  @returns {Noise} this
		 */
		Noise.prototype.dispose = function(){
			Source.prototype.dispose.call(this);
			if (this._source !== null){
				this._source.disconnect();
				this._source = null;
			}
			this._buffer = null;
			return this;
		};


		///////////////////////////////////////////////////////////////////////////
		// THE BUFFERS
		// borrowed heavily from http://noisehack.com/generate-noise-web-audio-api/
		///////////////////////////////////////////////////////////////////////////

		/**
		 *	static noise buffers
		 *
		 *  @static
		 *  @private
		 *  @type {AudioBuffer}
		 */
		var _pinkNoise = null;
	var _brownNoise = null;
	var _whiteNoise = null;
	function createNoise(context){

			var sampleRate = context.sampleRate;

			//four seconds per buffer
			var bufferLength = sampleRate * 4;

			//fill the buffers
			_pinkNoise = (function() {
				var buffer = context.createBuffer(2, bufferLength, sampleRate);
				for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++){
					var channel = buffer.getChannelData(channelNum);
					var b0, b1, b2, b3, b4, b5, b6;
					b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
					for (var i = 0; i < bufferLength; i++) {
						var white = Math.random() * 2 - 1;
						b0 = 0.99886 * b0 + white * 0.0555179;
						b1 = 0.99332 * b1 + white * 0.0750759;
						b2 = 0.96900 * b2 + white * 0.1538520;
						b3 = 0.86650 * b3 + white * 0.3104856;
						b4 = 0.55000 * b4 + white * 0.5329522;
						b5 = -0.7616 * b5 - white * 0.0168980;
						channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
						channel[i] *= 0.11; // (roughly) compensate for gain
						b6 = white * 0.115926;
					}
				}
				return buffer;
			}());

			_brownNoise = (function() {
				var buffer = context.createBuffer(2, bufferLength, sampleRate);
				for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++){
					var channel = buffer.getChannelData(channelNum);
					var lastOut = 0.0;
					for (var i = 0; i < bufferLength; i++) {
						var white = Math.random() * 2 - 1;
						channel[i] = (lastOut + (0.02 * white)) / 1.02;
						lastOut = channel[i];
						channel[i] *= 3.5; // (roughly) compensate for gain
					}
				}
				return buffer;
			})();

			_whiteNoise = (function(){
				var buffer = context.createBuffer(2, bufferLength, sampleRate);
				for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++){
					var channel = buffer.getChannelData(channelNum);
					for (var i = 0; i < bufferLength; i++){
						channel[i] =  Math.random() * 2 - 1;
					}
				}
				return buffer;
			}());
		}
		createNoise(context);

		Context.on("init", createNoise);

	/**
		 *  @class  NoiseSynth is composed of a noise generator (Noise), one filter (Filter),
		 *          and two envelopes (Envelop). One envelope controls the amplitude
		 *          of the noise and the other is controls the cutoff frequency of the filter.
		 *          <img src="https://docs.google.com/drawings/d/1rqzuX9rBlhT50MRvD2TKml9bnZhcZmzXF1rf_o7vdnE/pub?w=918&h=242">
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {Object} [options] the options available for the synth
		 *                          see defaults below
		 * @example
		 * var noiseSynth = new NoiseSynth().toMaster();
		 * noiseSynth.triggerAttackRelease("8n");
		 */
		var NoiseSynth = function(options){

			//get the defaults
			options = this.defaultArg(options, NoiseSynth.defaults);
			Instrument$1.call(this, options);

			/**
			 *  The noise source.
			 *  @type {Noise}
			 *  @example
			 * noiseSynth.set("noise.type", "brown");
			 */
			this.noise = new Noise();

			/**
			 *  The amplitude envelope.
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = new AmplitudeEnvelope$1(options.envelope);

			//connect the noise to the output
			this.noise.chain(this.envelope, this.output);
			//start the noise
			this.noise.start();
			this._readOnly(["noise", "envelope"]);
		};

		Tone$1.extend(NoiseSynth, Instrument$1);

		/**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
		NoiseSynth.defaults = {
			"noise" : {
				"type" : "white"
			},
			"envelope" : {
				"attack" : 0.005,
				"decay" : 0.1,
				"sustain" : 0.0,
			}
		};

		/**
		 *  Start the attack portion of the envelopes. Unlike other
		 *  instruments, NoiseSynth doesn't have a note.
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {number} [velocity=1] the velocity of the note (0-1)
		 *  @returns {NoiseSynth} this
		 *  @example
		 * noiseSynth.triggerAttack();
		 */
		NoiseSynth.prototype.triggerAttack = function(time, velocity){
			//the envelopes
			this.envelope.triggerAttack(time, velocity);
			return this;
		};

		/**
		 *  Start the release portion of the envelopes.
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {NoiseSynth} this
		 */
		NoiseSynth.prototype.triggerRelease = function(time){
			this.envelope.triggerRelease(time);
			return this;
		};

		/**
		 *  Trigger the attack and then the release.
		 *  @param  {Time} duration the duration of the note
		 *  @param  {Time} [time=now]     the time of the attack
		 *  @param  {number} [velocity=1] the velocity
		 *  @returns {NoiseSynth} this
		 */
		NoiseSynth.prototype.triggerAttackRelease = function(duration, time, velocity){
			time = this.toSeconds(time);
			duration = this.toSeconds(duration);
			this.triggerAttack(time, velocity);
			this.triggerRelease(time + duration);
			return this;
		};

		/**
		 *  Clean up.
		 *  @returns {NoiseSynth} this
		 */
		NoiseSynth.prototype.dispose = function(){
			Instrument$1.prototype.dispose.call(this);
			this._writable(["noise", "envelope"]);
			this.noise.dispose();
			this.noise = null;
			this.envelope.dispose();
			this.envelope = null;
			return this;
		};

	/**
		 *  @class Wrapper around Web Audio's native [DelayNode](http://webaudio.github.io/web-audio-api/#the-delaynode-interface).
		 *  @extends {Tone}
		 *  @param {Time=} delayTime The delay applied to the incoming signal.
		 *  @param {Time=} maxDelay The maximum delay time.
		 */
		var Delay = function(){

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
			this.delayTime = new Param$1({
				"param" : this._delayNode.delayTime,
				"units" : Type.Time,
				"value" : options.delayTime
			});

			this._readOnly("delayTime");
		};

		Tone$1.extend(Delay);

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
			Param$1.prototype.dispose.call(this);
			this._delayNode.disconnect();
			this._delayNode = null;
			this._writable("delayTime");
			this.delayTime = null;
			return this;
		};

	/**
		 *  @class Lowpass is a lowpass feedback comb filter. It is similar to
		 *         FeedbackCombFilter, but includes a lowpass filter.
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Time|Object} [delayTime] The delay time of the comb filter
		 *  @param {NormalRange=} resonance The resonance (feedback) of the comb filter
		 *  @param {Frequency=} dampening The cutoff of the lowpass filter dampens the
		 *                                signal as it is fedback.
		 */
		var LowpassCombFilter = function(){

			this.createInsOuts(1, 1);

			var options = this.optionsObject(arguments, ["delayTime", "resonance", "dampening"], LowpassCombFilter.defaults);

			/**
			 *  the delay node
			 *  @type {DelayNode}
			 *  @private
			 */
			this._delay = this.input = new Delay(options.delayTime);

			/**
			 *  The delayTime of the comb filter.
			 *  @type {Time}
			 *  @signal
			 */
			this.delayTime = this._delay.delayTime;

			/**
			 *  the lowpass filter
			 *  @type  {BiquadFilterNode}
			 *  @private
			 */
			this._lowpass = this.output = this.context.createBiquadFilter();
			this._lowpass.Q.value = -3.0102999566398125;
			this._lowpass.type = "lowpass";

			/**
			 *  The dampening control of the feedback
			 *  @type {Frequency}
			 *  @signal
			 */
			this.dampening = new Param$1({
				"param" : this._lowpass.frequency,
				"units" : Type.Frequency,
				"value" : options.dampening
			});

			/**
			 *  the feedback gain
			 *  @type {Gain}
			 *  @private
			 */
			this._feedback = new Gain$1(options.resonance, Type.NormalRange);

			/**
			 *  The amount of feedback of the delayed signal.
			 *  @type {NormalRange}
			 *  @signal
			 */
			this.resonance = this._feedback.gain;

			//connections
			this._delay.chain(this._lowpass, this._feedback, this._delay);
			this._readOnly(["dampening", "resonance", "delayTime"]);
		};

		Tone$1.extend(LowpassCombFilter);

		/**
		 *  the default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		LowpassCombFilter.defaults = {
			"delayTime" : 0.1,
			"resonance" : 0.5,
			"dampening" : 3000
		};

		/**
		 *  Clean up.
		 *  @returns {LowpassCombFilter} this
		 */
		LowpassCombFilter.prototype.dispose = function(){
			Tone$1.prototype.dispose.call(this);
			this._writable(["dampening", "resonance", "delayTime"]);
			this.dampening.dispose();
			this.dampening = null;
			this.resonance.dispose();
			this.resonance = null;
			this._delay.dispose();
			this._delay = null;
			this.delayTime = null;
			this._lowpass.disconnect();
			this._lowpass = null;
			this._feedback.disconnect();
			this._feedback = null;
			return this;
		};

	/**
		 *  @class Karplus-String string synthesis. Often out of tune.
		 *         Will change when the AudioWorkerNode is available across
		 *         browsers.
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {Object} [options] see the defaults
		 *  @example
		 * var plucky = new PluckSynth().toMaster();
		 * plucky.triggerAttack("C4");
		 */
		var PluckSynth = function(options){

			options = this.defaultArg(options, PluckSynth.defaults);
			Instrument$1.call(this, options);

			/**
			 *  @type {Noise}
			 *  @private
			 */
			this._noise = new Noise("pink");

			/**
			 *  The amount of noise at the attack.
			 *  Nominal range of [0.1, 20]
			 *  @type {number}
			 */
			this.attackNoise = options.attackNoise;

			/**
			 *  the LFCF
			 *  @type {LowpassCombFilter}
			 *  @private
			 */
			this._lfcf = new LowpassCombFilter({
				"resonance" : options.resonance,
				"dampening" : options.dampening
			});

			/**
			 *  The resonance control.
			 *  @type {NormalRange}
			 *  @signal
			 */
			this.resonance = this._lfcf.resonance;

			/**
			 *  The dampening control. i.e. the lowpass filter frequency of the comb filter
			 *  @type {Frequency}
			 *  @signal
			 */
			this.dampening = this._lfcf.dampening;

			//connections
			this._noise.connect(this._lfcf);
			this._lfcf.connect(this.output);
			this._readOnly(["resonance", "dampening"]);
		};

		Tone$1.extend(PluckSynth, Instrument$1);

		/**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
		PluckSynth.defaults = {
			"attackNoise" : 1,
			"dampening" : 4000,
			"resonance" : 0.9
		};

		/**
		 *  Trigger the note.
		 *  @param {Frequency} note The note to trigger.
		 *  @param {Time} [time=now] When the note should be triggered.
		 *  @returns {PluckSynth} this
		 */
		PluckSynth.prototype.triggerAttack = function(note, time) {
			note = this.toFrequency(note);
			time = this.toSeconds(time);
			var delayAmount = 1 / note;
			this._lfcf.delayTime.setValueAtTime(delayAmount, time);
			this._noise.start(time);
			this._noise.stop(time + delayAmount * this.attackNoise);
			return this;
		};

		/**
		 *  Clean up.
		 *  @returns {PluckSynth} this
		 */
		PluckSynth.prototype.dispose = function(){
			Instrument$1.prototype.dispose.call(this);
			this._noise.dispose();
			this._lfcf.dispose();
			this._noise = null;
			this._lfcf = null;
			this._writable(["resonance", "dampening"]);
			this.dampening = null;
			this.resonance = null;
			return this;
		};

	/**
		 *  @class  PolySynth handles voice creation and allocation for any
		 *          instruments passed in as the second paramter. PolySynth is
		 *          not a synthesizer by itself, it merely manages voices of
		 *          one of the other types of synths, allowing any of the
		 *          monophonic synthesizers to be polyphonic.
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {number|Object} [polyphony=4] The number of voices to create
		 *  @param {function} [voice=Synth] The constructor of the voices
		 *                                            uses Synth by default.
		 *  @example
		 * //a polysynth composed of 6 Voices of Synth
		 * var synth = new PolySynth(6, Synth).toMaster();
		 * //set the attributes using the set interface
		 * synth.set("detune", -1200);
		 * //play a chord
		 * synth.triggerAttackRelease(["C4", "E4", "A4"], "4n");
		 */
		var PolySynth = function(){

			Instrument.call(this);

			var options = this.optionsObject(arguments, ["polyphony", "voice"], PolySynth.defaults);
			options = this.defaultArg(options, Instrument.defaults);

			//max polyphony
			options.polyphony = Math.min(PolySynth.MAX_POLYPHONY, options.polyphony);

			/**
			 *  the array of voices
			 *  @type {Array}
			 */
			this.voices = new Array(options.polyphony);

			/**
			 *  The queue of voices with data about last trigger
			 *  and the triggered note
			 *  @private
			 *  @type {Array}
			 */
			this._triggers = new Array(options.polyphony);

			/**
			 *  The detune in cents
			 *  @type {Cents}
			 *  @signal
			 */
			this.detune = new Signal(options.detune, Type.Cents);
			this._readOnly("detune");

			//create the voices
			for (var i = 0; i < options.polyphony; i++){
				var v = new options.voice(arguments[2], arguments[3]);
				this.voices[i] = v;
				v.connect(this.output);
				if (v.hasOwnProperty("detune")){
					this.detune.connect(v.detune);
				}
				this._triggers[i] = {
					release : -1,
					note : null,
					voice : v
				};
			}

			//set the volume initially
			this.volume.value = options.volume;
		};

		Tone$1.extend(PolySynth, Instrument);

		/**
		 *  the defaults
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
		PolySynth.defaults = {
			"polyphony" : 4,
			"volume" : 0,
			"detune" : 0,
			"voice" : Synth
		};

		/**
		 *  Trigger the attack portion of the note
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} [time=now]  The start time of the note.
		 *  @param {number} [velocity=1] The velocity of the note.
		 *  @returns {PolySynth} this
		 *  @example
		 * //trigger a chord immediately with a velocity of 0.2
		 * poly.triggerAttack(["Ab3", "C4", "F5"], undefined, 0.2);
		 */
		PolySynth.prototype.triggerAttack = function(notes, time, velocity){
			if (!Array.isArray(notes)){
				notes = [notes];
			}
			time = this.toSeconds(time);
			for (var i = 0; i < notes.length; i++){
				var val = notes[i];
				//trigger the oldest voice
				var oldest = this._triggers[0];
				var oldestIndex = 0;
				for (var j = 1; j < this._triggers.length; j++){
					if (this._triggers[j].release < oldest.release){
						oldest = this._triggers[j];
						oldestIndex = j;
					}
				}
				oldest.release = Infinity;
				oldest.note = JSON.stringify(val);
				oldest.voice.triggerAttack(val, time, velocity);
			}
			return this;
		};

		/**
		 *  Trigger the attack and release after the specified duration
		 *
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} duration the duration of the note
		 *  @param  {Time} [time=now]     if no time is given, defaults to now
		 *  @param  {number} [velocity=1] the velocity of the attack (0-1)
		 *  @returns {PolySynth} this
		 *  @example
		 * //trigger a chord for a duration of a half note
		 * poly.triggerAttackRelease(["Eb3", "G4", "C5"], "2n");
		 *  @example
		 * //can pass in an array of durations as well
		 * poly.triggerAttackRelease(["Eb3", "G4", "C5"], ["2n", "4n", "4n"]);
		 */
		PolySynth.prototype.triggerAttackRelease = function(notes, duration, time, velocity){
			time = this.toSeconds(time);
			this.triggerAttack(notes, time, velocity);
			if (this.isArray(duration) && this.isArray(notes)){
				for (var i = 0; i < notes.length; i++){
					var d = duration[Math.min(i, duration.length - 1)];
					this.triggerRelease(notes[i], time + this.toSeconds(d));
				}
			} else {
				this.triggerRelease(notes, time + this.toSeconds(duration));
			}
			return this;
		};

		/**
		 *  Trigger the release of the note. Unlike monophonic instruments,
		 *  a note (or array of notes) needs to be passed in as the first argument.
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} [time=now]  When the release will be triggered.
		 *  @returns {PolySynth} this
		 *  @example
		 * poly.triggerRelease(["Ab3", "C4", "F5"], "+2n");
		 */
		PolySynth.prototype.triggerRelease = function(notes, time){
			if (!Array.isArray(notes)){
				notes = [notes];
			}
			time = this.toSeconds(time);
			for (var i = 0; i < notes.length; i++){
				//get the voice
				var stringified = JSON.stringify(notes[i]);
				for (var v = 0; v < this._triggers.length; v++){
					var desc = this._triggers[v];
					if (desc.note === stringified && desc.release > time){
						desc.voice.triggerRelease(time);
						desc.release = time;
					}
				}
			}
			return this;
		};

		/**
		 *  Set a member/attribute of the voices.
		 *  @param {Object|string} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {PolySynth} this
		 *  @example
		 * poly.set({
		 * 	"filter" : {
		 * 		"type" : "highpass"
		 * 	},
		 * 	"envelope" : {
		 * 		"attack" : 0.25
		 * 	}
		 * });
		 */
		PolySynth.prototype.set = function(params, value, rampTime){
			for (var i = 0; i < this.voices.length; i++){
				this.voices[i].set(params, value, rampTime);
			}
			return this;
		};

		/**
		 *  Get the synth's attributes. Given no arguments get
		 *  will return all available object properties and their corresponding
		 *  values. Pass in a single attribute to retrieve or an array
		 *  of attributes. The attribute strings can also include a "."
		 *  to access deeper properties.
		 *  @param {Array=} params the parameters to get, otherwise will return
		 *  					   all available.
		 */
		PolySynth.prototype.get = function(params){
			return this.voices[0].get(params);
		};

		/**
		 *  Trigger the release portion of all the currently active voices.
		 *  @param {Time} [time=now] When the notes should be released.
		 *  @return {PolySynth} this
		 */
		PolySynth.prototype.releaseAll = function(time){
			time = this.toSeconds(time);
			for (var i = 0; i < this._triggers.length; i++){
				var desc = this._triggers[i];
				if (desc.release > time){
					desc.release = time;
					desc.voice.triggerRelease(time);
				}
			}
			return this;
		};

		/**
		 *  Clean up.
		 *  @returns {PolySynth} this
		 */
		PolySynth.prototype.dispose = function(){
			Instrument.prototype.dispose.call(this);
			for (var i = 0; i < this.voices.length; i++){
				this.voices[i].dispose();
				this.voices[i] = null;
			}
			this._writable("detune");
			this.detune.dispose();
			this.detune = null;
			this.voices = null;
			this._triggers = null;
			return this;
		};

		/**
		 *  The maximum number of notes that can be allocated
		 *  to a polysynth.
		 *  @type  {Number}
		 *  @static
		 */
		PolySynth.MAX_POLYPHONY = 20;

	/**
		 *  @class Sampler wraps Player in an AmplitudeEnvelope.
		 *
		 *  @constructor
		 *  @extends {Instrument}
		 *  @param {String} url the url of the audio file
		 *  @param {Function=} onload The callback to invoke when the sample is loaded.
		 *  @example
		 * var sampler = new Sampler("./audio/casio/A1.mp3", function(){
		 * 	//repitch the sample down a half step
		 * 	sampler.triggerAttack(-1);
		 * }).toMaster();
		 */
		var Sampler = function(){

			var options = this.optionsObject(arguments, ["url", "onload"], Sampler.defaults);
			Instrument.call(this, options);

			/**
			 *  The sample player.
			 *  @type {Player}
			 */
			this.player = new Player(options.url, options.onload);
			this.player.retrigger = true;

			/**
			 *  The amplitude envelope.
			 *  @type {AmplitudeEnvelope}
			 */
			this.envelope = new AmplitudeEnvelope(options.envelope);

			this.player.chain(this.envelope, this.output);
			this._readOnly(["player", "envelope"]);
			this.loop = options.loop;
			this.reverse = options.reverse;
		};

		Tone$1.extend(Sampler, Instrument);

		/**
		 *  the default parameters
		 *  @static
		 */
		Sampler.defaults = {
			"onload" : Tone$1.noOp,
			"loop" : false,
			"reverse" : false,
			"envelope" : {
				"attack" : 0.001,
				"decay" : 0,
				"sustain" : 1,
				"release" : 0.1
			}
		};

		/**
		 *  Trigger the start of the sample.
		 *  @param {Interval} [pitch=0] The amount the sample should
		 *                              be repitched.
		 *  @param {Time} [time=now] The time when the sample should start
		 *  @param {NormalRange} [velocity=1] The velocity of the note
		 *  @returns {Sampler} this
		 *  @example
		 * sampler.triggerAttack(0, "+0.1", 0.5);
		 */
		Sampler.prototype.triggerAttack = function(pitch, time, velocity){
			time = this.toSeconds(time);
			pitch = this.defaultArg(pitch, 0);
			this.player.playbackRate = this.intervalToFrequencyRatio(pitch);
			this.player.start(time);
			this.envelope.triggerAttack(time, velocity);
			return this;
		};

		/**
		 *  Start the release portion of the sample. Will stop the sample once the
		 *  envelope has fully released.
		 *
		 *  @param {Time} [time=now] The time when the note should release
		 *  @returns {Sampler} this
		 *  @example
		 * sampler.triggerRelease();
		 */
		Sampler.prototype.triggerRelease = function(time){
			time = this.toSeconds(time);
			this.envelope.triggerRelease(time);
			this.player.stop(this.toSeconds(this.envelope.release) + time);
			return this;
		};

		/**
		 *  Trigger the attack and then the release after the duration.
		 *  @param  {Interval} interval     The interval in half-steps that the
		 *                                  sample should be pitch shifted.
		 *  @param  {Time} duration How long the note should be held for before
		 *                          triggering the release.
		 *  @param {Time} [time=now]  When the note should be triggered.
		 *  @param  {NormalRange} [velocity=1] The velocity the note should be triggered at.
		 *  @returns {Sampler} this
		 *  @example
		 * //trigger the unpitched note for the duration of an 8th note
		 * synth.triggerAttackRelease(0, "8n");
		 *  @memberOf Sampler#
		 *  @name triggerAttackRelease
		 *  @method triggerAttackRelease
		 */

		/**
		 * If the output sample should loop or not.
		 * @memberOf Sampler#
		 * @type {number|string}
		 * @name loop
		 */
		Object.defineProperty(Sampler.prototype, "loop", {
			get : function(){
				return this.player.loop;
			},
			set : function(loop){
				this.player.loop = loop;
			}
		});

		/**
		 * The direction the buffer should play in
		 * @memberOf Sampler#
		 * @type {boolean}
		 * @name reverse
		 */
		Object.defineProperty(Sampler.prototype, "reverse", {
			get : function(){
				return this.player.reverse;
			},
			set : function(rev){
				this.player.reverse = rev;
			}
		});

		/**
		 * The buffer to play.
		 * @memberOf Sampler#
		 * @type {Buffer}
		 * @name buffer
		 */
		Object.defineProperty(Sampler.prototype, "buffer", {
			get : function(){
				return this.player.buffer;
			},
			set : function(buff){
				this.player.buffer = buff;
			}
		});

		/**
		 *  Clean up.
		 *  @returns {Sampler} this
		 */
		Sampler.prototype.dispose = function(){
			Instrument.prototype.dispose.call(this);
			this._writable(["player", "envelope"]);
			this.player.dispose();
			this.player = null;
			this.envelope.dispose();
			this.envelope = null;
			return this;
		};

	window.Tone = PolySynth

	console.log(PolySynth)

}());