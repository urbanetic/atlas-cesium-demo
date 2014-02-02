define([
  'atlas/util/Class',
  'atlas/util/DeveloperError',
  'atlas/util/default',
  'atlas/util/mixin',
  'atlas/lib/keycode',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventHandler',
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventType',
  // Base class
  'atlas/input/InputManager'
], function (
  Class,
  DeveloperError,
  defaultValue,
  mixin,
  Keycode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  InputManagerCore) {

  /**
   * @classdesc The InputManager links render and implementation specific user input handling to
   * the format expected by atlas.
   * @param {Object} atlasManagers - The map of all atlas manager objects.
   *
   * @class atlas-cesium.input.InputManager
   * @extends atlas.input.InputManager
   */
  //var InputManager = function (atlasManagers) {
  var InputManager = mixin(InputManagerCore.extend(/** @lends atlas-cesium.input.InputManager# */ {

    /**
     * The Cesium event handlers that are defined.
     * @type {cesium/Core/ScreenSpaceEventHandler}
     * @private
     */
    _screenSpaceEventHandler: null,

    /**
     * Completes all initialisation that requires other atlas managers.
     * @param {String|HTMLElement} elem - The DOM ID or DOM element of the HTML element to receive events from.
     */
    setup: function (elem) {
      // Call super to setup _element.
      this._super(elem);
      // TODO(bpstudds): Pretty sure InputManager should respond to an 'dom/set' event, rather than be imperative.
      // Don't use Cesium mouse events at the minute...
      //this._screenSpaceEventHandler && this._screenSpaceEventHandler.destroy();
      //this._screenSpaceEventHandler = new ScreenSpaceEventHandler(element);
      // ... instead use generic HTML events.
      this.createHtmlMouseBindings();
      this.createHtmlKeyboardBindings();
    },

    /**
     * Creates bindings for Cesium screen space events, which handle mouse input poorly.
     */
    createDefaultMouseBindings: function () {

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.endPosition.x,
          y: movement.endPosition.y,
          startX: movement.startPosition.x,
          startY: movement.startPosition.y
        };
        this.handleInternalEvent('input/mousemove', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.MOUSE_MOVE);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/leftdown', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_DOWN);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/leftup', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_UP);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/leftclick', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.LEFT_CLICK);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/rightdown', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_DOWN);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/rightup', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_UP);

      this._screenSpaceEventHandler.setInputAction(function(movement) {
        var args = {
          x: movement.position.x,
          y: movement.position.y
        };
        this.handleInternalEvent('input/rightclick', args);
      }.bind(this._atlasManagers.event), ScreenSpaceEventType.RIGHT_CLICK);
    }
  }), // End class instance definitions.

    //InputManager.prototype.createHtmlMouseBindings = function () {}
    // Moved to atlas.input.InputManager

    //InputManager.prototype.createDefaultKeyboardBindings = function () {}
    // Moved to atlas.input.InputManager

//////
// STATICS

    {
      // Nope
    }
  ); // End class static definitions.

  return InputManager;
});

