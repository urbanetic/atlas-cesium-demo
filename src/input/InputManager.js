define([
  // Cesium imports.
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventHandler',
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventType',
  // Base class
  'atlas/input/InputManager',
  'atlas/lib/utility/Setter'
], function(ScreenSpaceEventHandler, ScreenSpaceEventType, InputManagerCore, Setter) {

  /**
   * @classdesc The InputManager links render and implementation specific user input handling to
   * the format expected by atlas.
   * @param {Object} managers - The map of all atlas manager objects.
   *
   * @class atlas-cesium.input.InputManager
   * @extends atlas.input.InputManager
   */
  var InputManager = Setter.mixin(InputManagerCore.extend(
      /** @lends atlas-cesium.input.InputManager# */{

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
        setup: function(elem) {
          // Call super to setup _element.
          this._super(elem);
          // TODO(bpstudds): Pretty sure InputManager should respond to an 'dom/set' event, rather than be imperative.
          // Don't use Cesium mouse events at the minute...
          // TODO(aramk) Added this to allow capturing wheel action - refactor and merge in.
          this._screenSpaceEventHandler = new ScreenSpaceEventHandler(this._element);
          this._createCesiumMouseBindings();
          // ... instead use generic HTML events.
          this.createHtmlMouseBindings();
          this.createHtmlKeyboardBindings();
        },

        _createCesiumMouseBindings: function() {
          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              // TODO(aramk) Is this range or z?
              position: { value: movement }
            };
            this.handleInternalEvent('input/wheel', args);
          }.bind(this._managers.event), ScreenSpaceEventType.WHEEL);
        },

        /**
         * Creates bindings for Cesium screen space events, which handle mouse input poorly.
         */
        createCesiumMouseBindings: function() {
          // TODO(bpstudds): Add 'movement' property to args.
          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.endPosition.x, y: movement.endPosition.y }
            };
            this.handleInternalEvent('input/mousemove', args);
          }.bind(this._managers.event), ScreenSpaceEventType.MOUSE_MOVE);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/leftdown', args);
          }.bind(this._managers.event), ScreenSpaceEventType.LEFT_DOWN);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/leftup', args);
          }.bind(this._managers.event), ScreenSpaceEventType.LEFT_UP);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/leftclick', args);
          }.bind(this._managers.event), ScreenSpaceEventType.LEFT_CLICK);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/rightdown', args);
          }.bind(this._managers.event), ScreenSpaceEventType.RIGHT_DOWN);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/rightup', args);
          }.bind(this._managers.event), ScreenSpaceEventType.RIGHT_UP);

          this._screenSpaceEventHandler.setInputAction(function(movement) {
            var args = {
              position: { x: movement.position.x, y: movement.position.y }
            };
            this.handleInternalEvent('input/rightclick', args);
          }.bind(this._managers.event), ScreenSpaceEventType.RIGHT_CLICK);
        }
      }), {

    // -------------------------------------------
    // STATICS
    // -------------------------------------------

  });

  return InputManager;
});

