import { Tone } from 'core';
import { Context } from 'core';

	/**
	 *  @class Wrapper around the OfflineAudioContext
	 *  @extends {Context
	 *  @param  {Number}  channels  The number of channels to render
	 *  @param  {Number}  duration  The duration to render in samples
	 *  @param {Number} sampleRate the sample rate to render at
	 */
	export function OfflineContext(channels, duration, sampleRate){
		/**
		 *  The offline context
		 *  @private
		 *  @type  {OfflineAudioContext}
		 */
		var offlineContext = new OfflineAudioContext(channels, duration * sampleRate, sampleRate);

		//wrap the methods/members
		Context.call(this, offlineContext);

		/**
		 *  A private reference to the duration
		 *  @private
		 *  @type  {Number}
		 */
		this._duration = duration;

		/**
		 *  An artificial clock source
		 *  @type  {Number}
		 *  @private
		 */
		this._currentTime = 0;

		//modify the lookAhead and updateInterval to one block
		this.lookAhead = this.blockTime;
		this.updateInterval = this.blockTime;
	};

	Tone.extend(OfflineContext, Context);

	/**
	 *  Override the now method to point to the internal clock time
	 *  @return  {Number}
	 */
	OfflineContext.prototype.now = function(){
		return this._currentTime;
	};

	/**
	 *  Overwrite this method since the worker is not necessary for the offline context
	 *  @private
	 */
	OfflineContext.prototype._createWorker = function(){
		//dummy worker that does nothing
		return {
			postMessage : function(){}
		};
	};

	/**
	 *  Render the output of the OfflineContext
	 *  @return  {Promise}
	 */
	OfflineContext.prototype.render = function(){
		while(this._duration - this._currentTime >= 0){
			//invoke all the callbacks on that time
			this.emit("tick");
			//increment the clock
			this._currentTime += prototype.blockTime;
		}

		//promise returned is not yet implemented in all browsers
		return new Promise(function(done){
			this._context.oncomplete = function(e){
				done(e.renderedBuffer);
			};
			this._context.startRendering();
		}.bind(this));
	};
