/**
 * This file is part of the MonVoisinFaitDuBio project.
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) 2016 Sebastian Castro - 90scastro@gmail.com
 * @license    MIT License
 * @Last Modified time: 2016-12-13
 */

declare let grecaptcha;
declare var $ : any;
declare let Routing : any;

import { AppModule, AppStates, AppModes } from "../app.module";
import { Element } from "../classes/element.class";
declare let App : AppModule;

import { capitalize, slugify } from "../../commons/commons";
import { openReportDeleteModal } from './reporting-deleting.component';

export function initializeElementMenu()
{	
	//   MENU PROVIDER
	let menu_element = $('#element-info-bar .menu-element');
	createListenersForElementMenu(menu_element);	

	$('#popup-report-error #select-reason').material_select();
	$('#modal-vote #select-vote').material_select();

	// button to confirm calculate idrections in modal pick address for directions
	$('#modal-pick-address #btn-calculate-directions').click(() => handleDirectionsPickingAddress());
	$('#modal-pick-address input').keyup((e) => { if(e.keyCode == 13) handleDirectionsPickingAddress(); });
}

function handleDirectionsPickingAddress()
{
	let address = $('#modal-pick-address input').val();
		
	if (address)
	{			
		App.setState(AppStates.ShowDirections,{id: getCurrentElementIdShown()});

		App.geocoder.geocodeAddress(address,
		() => {
			$("#modal-pick-address .modal-error-msg").hide();
			$('#modal-pick-address').closeModal();				
		},
		() => {
			$("#modal-pick-address .modal-error-msg").show();
		});			
	}
	else
	{
		$('#modal-pick-address input').addClass('invalid');
	}
}

function deleteElement()
{
	if (grecaptcha.getResponse().length === 0)
	{
		$('#captcha-error-message').show();
		grecaptcha.reset();
	}
	else
	{
		$('#captcha-error-message').hide();
		$('#popup-report-error').closeModal();
	}	
}

function onloadCaptcha() 
{
    grecaptcha.render('captcha', {
      'sitekey' : '6LcEViUTAAAAAOEMpFCyLHwPG1vJqExuyD4n1Lbw'
    });
}

export function updateFavoriteIcon(object, element : Element)
{
	if (!element.isFavorite) 
	{
		object.find('.item-add-favorite').show();
		object.find('.item-remove-favorite').hide();
	}	
	else 
	{
		object.find('.item-add-favorite').hide();
		object.find('.item-remove-favorite').show();
	}
}

export function showFullTextMenu(object, bool : boolean)
{
	if (bool)
	{
		object.addClass("full-text");
		object.find('.tooltipped').tooltip('remove');	
	}
	else
	{
		object.removeClass("full-text");
		object.find('.tooltipped').tooltip();	
	}
}

export function createListenersForElementMenu(object)
{
	object.find('.tooltipped').tooltip();

	object.find('.item-edit').click(function() {
		window.location.href = Routing.generate('biopen_element_edit', { id : getCurrentElementIdShown() }); 
	});

	object.find('.item-delete').click(function() 
	{		
		openReportDeleteModal();
	});

	object.find('.item-directions').click(function() 
	{
		let element = App.elementModule.getElementById(getCurrentElementIdShown());

		if (App.state !== AppStates.Constellation && !App.geocoder.getLocation())
		{
			let modal = $('#modal-pick-address');
			modal.find(".modal-footer").attr('option-id',element.colorOptionId);			
			
			modal.openModal({
	      dismissible: true, 
	      opacity: 0.5, 
	      in_duration: 300, 
	      out_duration: 200,
   		});
		}
		else App.setState(AppStates.ShowDirections,{id: getCurrentElementIdShown()});
	});

	object.find('.item-share').click(function()
	{
		let element = App.elementModule.getElementById(getCurrentElementIdShown());
		
		let modal = $('#modal-share-element');

		modal.find(".modal-footer").attr('option-id',element.colorOptionId);
		//modal.find(".input-simple-modal").removeClass().addClass("input-simple-modal " + element.colorOptionId);

		let url;
		if (App.mode == AppModes.Map)
		{
			url = window.location.href;
		}
		else
		{
			url = Routing.generate('biopen_directory_showElement', { name :  capitalize(slugify(element.name)), id : element.id }, true);	
		}

		modal.find('.input-simple-modal').val(url);
		modal.openModal({
	      dismissible: true, 
	      opacity: 0.5, 
	      in_duration: 300, 
	      out_duration: 200
   	});
	});	
	
	object.find('.item-add-favorite').click(function() 
	{
		let element = App.elementModule.getElementById(getCurrentElementIdShown());
		App.elementModule.addFavorite(getCurrentElementIdShown());

		updateFavoriteIcon(object, element);

		if (App.mode == AppModes.Map)
		{
			element.marker.update();
			element.marker.animateDrop();
		}
		
	});
	
	object.find('.item-remove-favorite').click(function() 
	{
		let element = App.elementModule.getElementById(getCurrentElementIdShown());
		App.elementModule.removeFavorite(getCurrentElementIdShown());
		
		updateFavoriteIcon(object, element);

		if (App.mode == AppModes.Map) element.marker.update();
	});	
}

export function getCurrentElementIdShown() : number
{
	return getCurrentElementInfoBarShown().attr('data-element-id');
}

export function getCurrentElementInfoBarShown()
{
	if ( App.mode == AppModes.Map ) 
	{
		return $('#element-info-bar').find('.element-item');
	}
	return $('.element-item.active');
}


/*function bookMarkMe()
{
	if (window.sidebar) { // Mozilla Firefox Bookmark
      window.sidebar.addPanel(location.href,document.title,"");
    } else if(window.external) { // IE Favorite
      window.external.AddFavorite(location.href,document.title); }
    else if(window.opera && window.print) { // Opera Hotlist
      this.title=document.title;
      return true;
    }
}*/
