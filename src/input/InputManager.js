define([
  'atlas/util/DeveloperError',
  'atlas/util/default',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventHandler',
  'atlas-cesium/cesium/Source/Core/ScreenSpaceEventType'
], function (DeveloperError, defaults, ScreenSpaceEventHandler, ScreenSpaceEventType) {

  /**
   * Constructs a new InputManager
   * @class The InputManager links render and implementation specific user input handling to
   * the format expected by atlas.
   * @param {Object} atlasManagers - The map of all atlas manager objects.
   *
   * @alias atlas-cesium.input.InputManager
   * @constructor
   */
  var InputManager = function (atlasManagers) {
    this._atlasManagers = atlasManagers;
    this._atlasManagers.input = this;

    /**
     * The Cesium event handlers that are defined.
     * @type {cesium/Core/ScreenSpaceEventHandler}
     * @private
     */
    this._screenSpaceEventHandler = null;
  };

  /**
   * Completes all initialisation that requires other atlas managers.
   * @param {String|HTMLElement} elem - The DOM ID or DOM element of the HTML element to receive events from.
   */
  InputManager.prototype.setup = function (elem) {
    var element = typeof elem === 'string' ? document.getElementById(elem) : elem;
    // TODO(bpstudds): Pretty sure InputManager should respond to an 'dom/set' event, rather than be
    //      imperative.
    this._screenSpaceEventHandler && this._screenSpaceEventHandler.destroy();
    this._screenSpaceEventHandler = new ScreenSpaceEventHandler(element);
    this.createDefaultMouseBindings();
    this.createDefaultKeyboardBindings();
  };

  /**
   * Creates the default bindings between Cesium screen space events and Atlas events.
   */
  InputManager.prototype.createDefaultMouseBindings = function () {

    this._screenSpaceEventHandler.setInputAction(function(movement) {
      args = {
        x: movement.endPosition.x,
        y: movement.endPosition.y,
        startX: movement.startPosition.x,
        startY: movement.startPosition.y
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

  InputManager.prototype.createDefaultKeyboardBindings = function () {
    // TODO(bpstudds): Provide cleaner API for accessing the DOM element.
    // TODO(bpstudds): Create Event for (eg) dom/attached and have this bind to that.
    var theDom = document.getElementById(this._atlasManagers.dom._currentDomId);
    var domEventNames = ['keydown', 'keypress', 'keyup'];
    domEventNames.forEach(function (name) {
      console.log('adding event listener to', name);
      var thisEvent = 'input/' + name;
      document.addEventListener(name, function (e) {
        var args = {
          'name': thisEvent,
          'key': e.keyCode,
          'modifiers': []
        };
        e.shiftKey && args.modifiers.push('shift');
        e.metaKey && args.modifiers.push('meta');
        e.altKey && args.modifiers.push('alt');
        e.ctrlKey && args.modifiers.push('ctrl');
        this.handleInternalEvent(args.name, args);
      }.bind(this._atlasManagers.event), false);
    }, this);
  };

  return InputManager;
});

