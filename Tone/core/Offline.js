import { Tone } from 'core';
import { Transport } from 'core';
import { Buffer } from 'core';
import { OfflineContext } from 'core';

	/**
	 *  Record a segment of the Transport
	 *  @param  {Function}  callback  All js nodes which are created and scheduled within this callback are recorded into the output Buffer.
	 *  @param  {Time}  duration     the amount of time to record for.
	 *  @return  {Promise}  The promise which is invoked with the Buffer of the recorded output.
	 *  @example
	 * //render 2 seconds of the oscillator
	 * Offline(function(){
	 * 	//only nodes created in this callback will be recorded
	 * 	var oscillator = new Oscillator().toMaster().start(0)
	 * 	//schedule their events
	 * }, 2).then(function(buffer){
	 * 	//do something with the output buffer
	 * })
	 * @example
	 * //can also schedule events along the Transport
	 * Offline(function(){
	 	var osc = new Oscillator().toMaster()
	 * 	Transport.schedule(function(time){
	 * 		osc.start(time).stop(time + 0.1)
	 * 	}, 1)
	 * 	Transport.start(0.2)
	 * }, 4).then(function(buffer){
	 * 	//do something with the output buffer
	 * })
	 */
	export function Offline(callback, duration){
		//set the OfflineAudioContext
		var sampleRate = context.sampleRate;
		var originalContext = context;
		var context = new OfflineContext(2, duration, sampleRate);
		context = context;

		//invoke the callback/scheduling
		callback(Transport);

		//process the audio
		var rendered = context.render();

		//return the original AudioContext
		context = originalContext;

		//return the audio
		return rendered.then(function(buffer){
			//wrap it in a Buffer
			return new Buffer(buffer);
		});
	};
