/**
 * This file is part of the GoGoCarto project.
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) 2016 Sebastian Castro - 90scastro@gmail.com
 * @license GNU GPL v3
 * @Last Modified time: 2016-12-13
 */
import { AppModule, AppStates, AppModes } from "../../app.module";
import { ElementBase, ElementStatus, ElementModerationState } from './element-base.class';
export { ElementStatus, ElementModerationState } from './element-base.class';
import { Marker } from "../../components/map/marker.component";
import { ElementComponent } from "../../components/element/element.component";
import { OptionValue, CategoryValue, Option, Category, Contribution, VoteReport } from "../classes";
import { capitalize } from "../../utils/string-helpers";

import { App } from "../../gogocarto";
declare var $;

export class Element extends ElementBase
{	
	private marker_ : Marker = null;
	private component_ : ElementComponent = null;	

	colorOptionId : number;

	private isInitialized_ : boolean = false;

	iconsToDisplay : OptionValue[] = [];	

	distance : number;
	distanceFromBoundsCenter : number;	

	// for elements module algorithms
	isDisplayed : boolean = false;	

	isShownAlone : boolean = false;
	isFavorite : boolean = false;
	needToBeUpdatedWhenShown : boolean = true;

	constructor(elementJson : any)
  {
    super(elementJson);  
  }

  updateWithJson(elementJson)
  {
  	super.updateWithJson(elementJson);
  	this.createOptionsTree();
    this.update(true);
  }	

	initialize() 
	{		
		App.elementIconsModule.updateIconsToDisplay(this);

		this.marker_ = new Marker(this.id, this.position);
		this.isInitialized_ = true;	
	}

	update($force : boolean = false)
	{
		//console.log("marker update needToBeUpdated", this.needToBeUpdatedWhenShown);
		if (this.needToBeUpdatedWhenShown || App.mode == AppModes.List || $force)
		{
			App.elementIconsModule.updateIconsToDisplay(this);

			let optionValuesToUpdate = this.getCurrOptionsValues().filter( (optionValue) => optionValue.isFilledByFilters);
			optionValuesToUpdate.push(this.getCurrMainOptionValue());
			for(let optionValue of optionValuesToUpdate) App.elementOptionValuesModule.updateOptionValueColor(this, optionValue);

			this.colorOptionId = this.iconsToDisplay.length > 0 && this.getIconsToDisplay()[0] ? this.getIconsToDisplay()[0].colorOptionId : null;	

			if (this.marker) this.marker.update();
			this.needToBeUpdatedWhenShown = false;
		}		
	}

	updateDistance()
	{
		this.distance = null;
		this.distanceFromBoundsCenter = App.boundsModule.extendedBounds ? App.boundsModule.extendedBounds.getCenter().distanceTo(this.position) / 1000 : null;

		if (App.geocoder.getLocation()) 
			this.distance = App.mapComponent.distanceFromLocationTo(this.position);
		else
			this.distance = this.distanceFromBoundsCenter;
		
		// Making the distance more realistic multiplying
		this.distance = this.distance ? Math.round(1.2*this.distance) : null;
		this.distanceFromBoundsCenter = this.distanceFromBoundsCenter ? Math.round(1.2*this.distanceFromBoundsCenter) : null;
	}

	getProperty(propertyName)
	{
		return App.elementFormaterModule.getProperty(this, propertyName);
	}

	getIconsToDisplay() : OptionValue[]
  {
    let result = this.iconsToDisplay;
    return result.sort( (a,b) => a.isFilledByFilters ? -1 : 1);
  }

	getCurrOptionsValues() : OptionValue[]
	{
		return this.optionsValues.filter( (optionValue) => optionValue.option.mainOwnerId == App.currMainId);
	}

	getCurrMainOptionValue() : OptionValue
	{
		return this.optionsValues.filter( (optionValue) => optionValue.option.id == App.currMainId).shift();
	}

	getCategoriesIds() : number[]
	{
		return this.getCurrOptionsValues().map( (optionValue) => optionValue.categoryOwner.id).filter((value, index, self) => self.indexOf(value) === index);
	}

	getOptionsIdsInCategorieId(categoryId) : number[]
	{
		return this.getCurrOptionsValues().filter( (optionValue) => optionValue.option.ownerId == categoryId).map( (optionValue) => optionValue.optionId);
	}	

	isPending() { return this.status == ElementStatus.PendingAdd || this.status == ElementStatus.PendingModification; }
	isDeleted() { return this.status <= ElementStatus.AdminRefused }
	needsModeration() { return this.moderationState != ElementModerationState.NotNeeded }	

	get marker() : Marker { return this.marker_; }
	get component() { return this.component_ || (this.component_ = new ElementComponent(this)); }	
	get isInitialized() { return this.isInitialized_; }

}
