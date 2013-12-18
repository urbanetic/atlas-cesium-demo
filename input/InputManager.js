define([
  'atlas/util/DeveloperError',
  'atlas/util/default',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventHandler',
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventType'
], function (DeveloperError, defaults, ScreenSpaceEventHandler, ScreenSpaceEventType) {

  var InputManager = function (atlasManagers) {
    this._atlasManagers = atlasManagers;
    this._atlasManagers.input = this;

    /**
     * Contains a map of Atlas input event names to the Cesium ScreenSpaceEventHandler objects.
     * @type {Object}
     */
    this._handlers = {};

    this._element = null;
    this._screenSpaceEventHandler = null;
  }

  /**
   * Completes all initialisation that requires other atlas managers.
   * @param {String} domId - The DOM ID of the HTML element to receive events from.
   */
  InputManager.prototype.initialise = function (domId) {
    this._element = document.getElementById(domId);
    // TODO(bpstudds): Should the InputManager be bound to the Atlas dom element?
    this._screenSpaceEventHandler = new ScreenSpaceEventHandler(this._element);

    this.createDefaultBinds();
  }

  /**
   * Creates the default bindings between Cesium screen space events and Atlas events.
   */
  InputManager.prototype.createDefaultBinds = function () {

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.endPosition.x,
        y: movement.endPosition.y,
      };
      this.handleInternalEvent('input/mousemove', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.MOUSE_MOVE);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/leftdown', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_DOWN);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/leftup', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_UP);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/leftclick', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_CLICK);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/rightdown', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_DOWN);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/rightup', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_UP);

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.position.x,
        y: movement.position.y
      };
      this.handleInternalEvent('input/rightclick', args);
    }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_CLICK);

  };

  // Add a handler to a particulare input event.
  InputManager.prototype.addHandler = function (name) {};

  // Remove a particular input handler
  InputManager.prototype.removeHandler = function (id, name) {};

  // Remove all defined handlers
  InputManager.prototype.removeAllHandlers = function () {};

  // Ignore events of a particular type?
  InputManager.prototype.ignoreEvent = function (name) {};

  // Restore the default handlers defined in the InputManager
  InputManager.prototype.resetDefaultHandlers = function () {};

  return InputManager;
});

