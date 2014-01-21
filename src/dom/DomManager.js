define([
  'atlas/util/Extends',
  'atlas/dom/DomManager'
], function (extend, DomManagerCore) {

  var DomManager = function(atlasManagers) {
    DomManager.base.constructor.call(this, atlasManagers);
    /*
    Inherits from DomManagerCore
    this._atlasManagers
    this._currentNode
    this._rendered
    this._visible
    */
  };
  extend(DomManagerCore, DomManager);

  DomManager.prototype.populateDom = function (elem) {
    this._atlasManagers.render.createWidget(elem);
    this._rendered = true;
    this._visible = true;
  };

  return DomManager;
});