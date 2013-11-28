define([
  'atlas/util/Extends',
  'atlas/dom/DomManager'
], function (extend, DomManagerCore) {

  var DomManager = function(rm) {
    DomManager.base.constructor.call(this, rm);
    /*
    Inherits from DomManagerCore
    this._renderManager
    this._currentNode
    this._rendered
    this._visible
    */
  };
  extend(DomManagerCore, DomManager);

  DomManager.prototype.populateDom = function (elem) {
    this._renderManager.createWidget(elem);
    this._rendered = true;
    this._visible = true;
  };

  return DomManager;
});