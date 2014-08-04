define([
  'atlas/dom/DomManager'
], function(DomManager) {
  return DomManager.extend({

    populateDom: function(elem) {
      this._managers.render.createWidget(elem);
      this._rendered = true;
      this._visible = true;
    }

  });
});
