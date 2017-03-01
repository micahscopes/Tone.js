import { Tone } from 'core/Tone';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *	@class  Split splits an incoming signal into left and right channels.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @example
	 * var split = new Split();
	 * stereoSignal.connect(split);
	 */
	export var Split = function(){

		this.createInsOuts(0, 2);

		/**
		 *  @type {ChannelSplitterNode}
		 *  @private
		 */
		this._splitter = this.input = this.context.createChannelSplitter(2);

		/**
		 *  Left channel output.
		 *  Alias for <code>output[0]</code>
		 *  @type {Gain}
		 */
		this.left = this.output[0] = new Gain();

		/**
		 *  Right channel output.
		 *  Alias for <code>output[1]</code>
		 *  @type {Gain}
		 */
		this.right = this.output[1] = new Gain();

		//connections
		this._splitter.connect(this.left, 0, 0);
		this._splitter.connect(this.right, 1, 0);
	};

	Tone.extend(Split);

	/**
	 *  Clean up.
	 *  @returns {Split} this
	 */
	Split.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._splitter.disconnect();
		this.left.dispose();
		this.left = null;
		this.right.dispose();
		this.right = null;
		this._splitter = null;
		return this;
	};
