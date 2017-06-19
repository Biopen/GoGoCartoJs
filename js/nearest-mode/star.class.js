/**
 * This file is part of the MonVoisinFaitDuBio project.
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) 2016 Sebastian Castro - 90scastro@gmail.com
 * @license    MIT License
 * @Last Modified time: 2017-03-18 09:21:41
 */
function Star(name, elementList) 
{
  this.name_ = name; 
  this.elementIdList_ = [];
  for(var i = 0; i < elementList.length; i++)
  {
      this.elementIdList_.push(elementList[i].id);
  }
  this.index_ = 0;
}

Star.prototype.getName = function () {
  return this.name_ ;
};

Star.prototype.getElementId = function () {
  return this.elementIdList_[this.index_];
};

Star.prototype.getdirectory-content-listId = function () {
  return this.elementIdList_;
};

Star.prototype.getElementIndexFromId = function (id) {

  for(var i = 0; i < this.elementIdList_.length; i++)
  {
     if (this.elementIdList_[i] == id) return i;
  }
};



Star.prototype.getElement = function () {
  return App.elementModule.getElementById(this.getElementId());  
};

Star.prototype.getPosition = function () {
  var element = this.getElement();
  return new google.maps.LatLng(element.latlng.latitude, element.latlng.longitude);
};

Star.prototype.getMarker = function () {
  return App.getMarkerModule().getMarkerById(this.getElementId());
};

Star.prototype.isVisible = function () {
  
  return this.getMarker().getVisible();
};

Star.prototype.isClustered = function () 
{
  if (App.clusterer === null) return false;

  var clusters = App.clusterer().getMinimizedClusters();

  for (j = 0; j < clusters.length; j++)
  {
  	if (clusters[j].getMarkers().indexOf(this.marker_) > -1) return true;
  }

  return false;
};

Star.prototype.indexForward = function ()
{
	this.setIndex(this.index_ + 1);
};

Star.prototype.indexBackward = function ()
{
	this.setIndex(this.index_ - 1);
};

Star.prototype.getIndex = function ()
{
	return this.index_;
};

Star.prototype.setIndex = function (newIndex)
{
  if (newIndex < 0 || newIndex >= this.elementIdList_.length) return false;

	var oldElementId = this.getElementId();

  $('moreResult-'+this.name_+'-'+this.index_).removeClass('starElement');
  $('moreResult-'+this.name_+'-'+newIndex).addClass('starElement');
	
	this.index_ = newIndex;

  // on met à day le marqueur des deux elements interchangés
  App.getMarkerModule().getMarkerById(oldElementId).update();

  var newMarkerRepresentStar = App.getMarkerModule().getMarkerById(this.getElementId());

  newMarkerRepresentStar.update();
  newMarkerRepresentStar.animateDrop();

  // on met à day les info elements des deux elements interchangés
  $('#element-info-'+this.getElementId()).find('.row.'+this.name_).find('.disabled').removeClass('disabled');
  /*$('#directory-content-list #element-info-'+this.getElementId()).find('.row.'+this.name_).find('.disabled').removeClass('disabled');*/
  /*$('#element-info-'+oldElementId).find('.row.'+this.name_).find('.product, .icon, .detail').addClass('disabled');*/

  App.getListElementModule().draw();
};





