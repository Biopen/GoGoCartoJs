/**
 * This file is part of the GoGoCarto project.
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) 2016 Sebastian Castro - 90scastro@gmail.com
 * @license GNU GPL v3
 * @Last Modified time: 2016-12-13
 */

import { Event } from "../classes/event.class";
import { AppModule, AppStates } from "../app.module";
import { Element } from "../classes/classes";

import { App } from "../gogocarto";
declare var $ : any, L : any;
declare let Routing;

export class Request
{
	constructor(public route : string, public data : any) {};
}

export class AjaxModule
{
	onNewElements = new Event<any[]>();

	isRetrievingElements : boolean = false;

	currElementIdRetrieving : number;

	requestWaitingToBeExecuted : boolean = false;
	waitingRequestFullRepresentation : boolean = null;

	currRequest : Request = null;

	loaderTimer = null;

	allElementsReceived = false;

	constructor() { }  

	sendRequest(route : string, method : string, data : any, callbackSuccess?, callbackFailure?)
	{
		//console.log("SendAjaxRequest to " + route, data);
		$.ajax({
			url: route,
			method: method,
			data: data,
			success: response => { if (response && callbackSuccess) callbackSuccess(response); },
			error: response => { if (callbackFailure) callbackFailure(response.data); }
		});
	}

	getElementById(elementId, callbackSuccess?, callbackFailure?)
	{
		if (elementId == this.currElementIdRetrieving) return;

		let route = App.config.data.elementsApiUrl + '/' + elementId;
		this.currElementIdRetrieving = elementId;
		
		$.ajax({
			url: route,
			method: "get",
			data: { },
			success: response => 
			{	        
				if (response)
				{					
					let elementJson;	
					if (response.data) elementJson = Array.isArray(response.data) ? response.data[0] : response.data;			
					else elementJson = response;

					if (callbackSuccess) callbackSuccess(elementJson); 					
				}	
				else if (callbackFailure) callbackFailure(response); 
				
				this.currElementIdRetrieving = null;				       
			},
			error: response => { if (callbackFailure) callbackFailure(response); this.currElementIdRetrieving = null; }
		});
	};

	getElementsInBounds($bounds : L.LatLngBounds[], getFullRepresentation : boolean = false, expectedFilledBounds : L.LatLngBounds)
	{
		// if invalid location we abort
		if (!$bounds || $bounds.length == 0 || !$bounds[0]) { return; }

		let boundsResult = this.convertBoundsIntoParams($bounds);

		let dataRequest : any = { bounds : boundsResult.boundsString, 
															boundsJson : boundsResult.boundsJson,
															mainOptionId : App.currMainId, 
															fullRepresentation : getFullRepresentation, 
															ontology : getFullRepresentation ? 'gogofull' : 'gogocompact' };
		

		let route = App.config.data.elementsApiUrl;
		
		this.sendAjaxElementRequest(new Request(route, dataRequest), expectedFilledBounds);
	}	

	private convertBoundsIntoParams($bounds : L.LatLngBounds[]) 
	{
		let stringifiedBounds = "";
		let digits = 5;
		let boundsLessDigits = [];
		for (let bound of $bounds) 
		{
			let southWest = L.latLng(L.Util.formatNum(bound.getSouthWest().lat, digits), L.Util.formatNum(bound.getSouthWest().lng, digits))
			let nortEast = L.latLng(L.Util.formatNum(bound.getNorthEast().lat, digits), L.Util.formatNum(bound.getNorthEast().lng, digits))
			bound = L.latLngBounds(southWest, nortEast);
			boundsLessDigits.push(bound);
			stringifiedBounds += bound.toBBoxString() + ";";
		}

		return {boundsString: stringifiedBounds, boundsJson: JSON.stringify(boundsLessDigits)};
	}

	private sendAjaxElementRequest($request : Request, $expectedFilledBounds = null)
	{
		if (this.allElementsReceived) { /*console.log("All elements already received");*/ return; }

		// console.log("Ajax send elements request ", $request);

		if (this.isRetrievingElements)
		{		
			//console.log("Ajax isRetrieving");
			this.requestWaitingToBeExecuted = true;
			this.waitingRequestFullRepresentation = $request.data.fullRepresentation;
			return;
		}

		this.isRetrievingElements = true;
		this.currRequest = $request;
		// let start = new Date().getTime();			
		
		$.ajax({
			url: $request.route,
			method: "get",
			data: $request.data,
			beforeSend: () =>
			{ 				
				this.loaderTimer = setTimeout(function() { $('#directory-loading').show(); }, 1500); 
			},
			success: response =>
			{	
				if (response.data !== null)
				{
					// let end = new Date().getTime();					
					// console.log("receive " + response.data.length + " elements in " + (end-start) + " ms. fullRepresentation", response.fullRepresentation);				

					response.fullRepresentation = response.ontology == "gogocompact" ? false : true;
					
					if ($expectedFilledBounds)
					{
						App.boundsModule.updateFilledBoundsWithBoundsReceived($expectedFilledBounds, $request.data.mainOptionId,  $request.data.fullRepresentation);
					}
					this.onNewElements.emit(response);				
				}
			  
			  if (response.allElementsSends) this.allElementsReceived = true;   
			},
			complete: () =>
			{
			  this.isRetrievingElements = false;
			  clearTimeout(this.loaderTimer);
			  setTimeout( () => $('#directory-loading').hide(), 250);
			  if (this.requestWaitingToBeExecuted)
			  {
			  	 //console.log("REQUEST WAITING TO BE EXECUTED, fullRepresentation", this.waitingRequestFullRepresentation);
			  	 App.elementsManager.checkForNewElementsToRetrieve(this.waitingRequestFullRepresentation);
			  	 this.requestWaitingToBeExecuted = false;
			  }
			},
		});
	};
}