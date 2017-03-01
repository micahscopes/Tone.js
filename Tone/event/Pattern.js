import { Tone } from 'core/Tone';

import { Loop } from 'event/Loop';

import { CtrlPattern } from 'control/CtrlPattern';


	/**
	 *  @class Pattern arpeggiates between the given notes
	 *         in a number of patterns. See CtrlPattern for
	 *         a full list of patterns.
	 *  @example
	 * var pattern = new Pattern(function(time, note){
	 *   //the order of the notes passed in depends on the pattern
	 * }, ["C2", "D4", "E5", "A6"], "upDown");
	 *  @extends {Loop}
	 *  @param {Function} callback The callback to invoke with the
	 *                             event.
	 *  @param {Array} values The values to arpeggiate over.
	 */
	export var Pattern = function(){

		var options = this.optionsObject(arguments, ["callback", "values", "pattern"], Pattern.defaults);

		Loop.call(this, options);

		/**
		 *  The pattern manager
		 *  @type {CtrlPattern}
		 *  @private
		 */
		this._pattern = new CtrlPattern({
			"values" : options.values,
			"type" : options.pattern,
			"index" : options.index
		});

	};

	Tone.extend(Pattern, Loop);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Pattern.defaults = {
		"pattern" : CtrlPattern.Type.Up,
		"values" : [],
	};

	/**
	 *  Internal function called when the notes should be called
	 *  @param  {Number}  time  The time the event occurs
	 *  @private
	 */
	Pattern.prototype._tick = function(time){
		this.callback(time, this._pattern.value);
		this._pattern.next();
	};

	/**
	 *  The current index in the values array.
	 *  @memberOf Pattern#
	 *  @type {Positive}
	 *  @name index
	 */
	Object.defineProperty(Pattern.prototype, "index", {
		get : function(){
			return this._pattern.index;
		},
		set : function(i){
			this._pattern.index = i;
		}
	});

	/**
	 *  The array of events.
	 *  @memberOf Pattern#
	 *  @type {Array}
	 *  @name values
	 */
	Object.defineProperty(Pattern.prototype, "values", {
		get : function(){
			return this._pattern.values;
		},
		set : function(vals){
			this._pattern.values = vals;
		}
	});

	/**
	 *  The current value of the pattern.
	 *  @memberOf Pattern#
	 *  @type {*}
	 *  @name value
	 *  @readOnly
	 */
	Object.defineProperty(Pattern.prototype, "value", {
		get : function(){
			return this._pattern.value;
		}
	});

	/**
	 *  The pattern type. See CtrlPattern for the full list of patterns.
	 *  @memberOf Pattern#
	 *  @type {String}
	 *  @name pattern
	 */
	Object.defineProperty(Pattern.prototype, "pattern", {
		get : function(){
			return this._pattern.type;
		},
		set : function(pattern){
			this._pattern.type = pattern;
		}
	});

	/**
	 *  Clean up
	 *  @return  {Pattern}  this
	 */
	Pattern.prototype.dispose = function(){
		Loop.prototype.dispose.call(this);
		this._pattern.dispose();
		this._pattern = null;
	};
