define([
  'atlas/dom/DomManager'
], function(DomManagerCore) {

  /**
   * @typedef atlas-cesium.dom.DomManager
   * @ignore
   */
  var DomManager;

  /**
   * @class atlas-cesium.dom.DomManager
   */
  DomManager = DomManagerCore.extend(/** @lends atlas-cesium.dom.DomManager# */{

    populateDom: function() {
      var node = this.getDomNode();
      this._managers.render.createWidget(node);
      this._rendered = true;
      this._visible = true;
    }

  });

  return DomManager;
});
