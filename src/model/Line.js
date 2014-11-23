define([
  'atlas/model/Line',
  'atlas-cesium/model/Colour',
  'atlas-cesium/model/Handle',
  'atlas-cesium/model/Style',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/CorridorGeometry',
  'atlas-cesium/cesium/Source/Core/PolylineGeometry',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/CornerType',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/PolylineColorAppearance',
  'atlas/lib/utility/Log',
  'atlas/util/DeveloperError'
], function(LineCore, Colour, Handle, Style, GeometryInstance, CorridorGeometry, PolylineGeometry,
            ColorGeometryInstanceAttribute, CornerType, Primitive, PerInstanceColorAppearance,
            PolylineColorAppearance, Log, DeveloperError) {
  /**
   * @typedef atlas-cesium.model.Line
   * @ignore
   */
  var Line;

  /**
   * @class atlas-cesium.model.Line
   * @extends atlas.model.Line
   */
  Line = LineCore.extend(/** @lends atlas-cesium.model.Line# */{

    // TODO(aramk) Refactor this wth Polygon and Mesh, a lot of building logic is very similar.
    // TODO(aramk) See above - this will add support for elevation.

    /**
     * The Cesium GeometryInstance of the Polygon.
     * @type {GeometryInstance}
     * @private
     */
    _geometry: null,

    /**
     * The Cesium appearance data of the Polygon.
     * @type {PerInstanceColorAppearance}
     * @private
     */
    _appearance: null,

    /**
     * The Cesium Primitive instance of the Polygon, used to render the Polygon in Cesium.
     * @type {Primitive}
     * @private
     */
    _primitive: null,

    /**
     * An array of Cesium cartesian coordinates describing the position of the Polygon
     * on the Cesium globe.
     * @see  {@link http://cesiumjs.org/Cesium/Build/Documentation/Cartesian3.html}
     * @type {Array.<Cartesian3>}
     */
    _cartesians: null,

    /**
     * The minimum terrain elevation underneath the Polygon.
     * @type {Number}
     */
    _minTerrainElevation: 0.0,

    /**
     * The ID of the handler used for updating styles. Only one handler should be running. Any
     * existing handler should be cancelled.
     * @type {Number}
     */
    _updateStyleHandle: null,

    // -------------------------------------------
    // CONSTRUCTION
    // -------------------------------------------

    _build: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
        this.isDirty('model');
      var isStyleDirty = this.isDirty('style');
      var cancelStyleUpdate = function() {
        clearInterval(this._updateStyleHandle);
        this._updateStyleHandle = null;
      }.bind(this);
      if (isModelDirty) {
        this._removePrimitives();
      }
      this._createGeometry();
      this._createAppearance();
      if (isModelDirty || isStyleDirty) {
        // Cancel any existing handler for updating to avoid race conditions.
        cancelStyleUpdate();
      }
      if (fillColor) {
        if ((isModelDirty || !this._primitive) && this._geometry) {
          this._primitive = new Primitive({
            geometryInstances: this._geometry,
            appearance: this._appearance
          });
        } else if (isStyleDirty && this._appearance) {
          var timeout = 3000;
          var duration = 0;
          var freq = 100;
          var setHandle = function() {
            this._updateStyleHandle = setInterval(updateStyle, freq);
          }.bind(this);
          var isReady = function() {
            return this._primitive.ready;
          }.bind(this);
          var updateStyle = function() {
            if (isReady()) {
              var geometryAtts = this._primitive.getGeometryInstanceAttributes(this._geometry.id);
              geometryAtts.color = ColorGeometryInstanceAttribute.toValue(fillColor);
              cancelStyleUpdate();
            }
            duration += freq;
            duration >= timeout && cancelStyleUpdate();
          }.bind(this);
          // Only delay the update if necessary.
          if (isReady()) {
            updateStyle();
          } else {
            setHandle()
          }
        }
      }
      this._addPrimitives();
      this._super();
    },

    /**
     * Creates the geometry data as required.
     * @private
     */
    _createGeometry: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var geometryId = this.getId();
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
        this.isDirty('model');
      var shouldCreateGeometry = fillColor && (isModelDirty || !this._geometry);
      if (!shouldCreateGeometry) {
        return;
      }
      // Generate new cartesians if the vertices have changed.
      if (isModelDirty || !this._cartesians || !this._minTerrainElevation) {
        Log.debug('updating geometry for entity ' + this.getId());
        // Remove duplicate vertices which cause Cesium to break (4 identical, consecutive vertices
        // cause the renderer to crash).
        var vertices = this._vertices.filter(function(point, i) {
          if (i === 0) {
            return true;
          } else {
            return !this._vertices[i - 1].equals(this._vertices[i]);
          }
        }, this);
        if (vertices.length < 2) {
          return;
        }
        this._cartesians = this._renderManager.cartesianArrayFromGeoPointArray(vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(vertices);
      }
      // Generate geometry data.
      var reWidth = /(\d+)(px)?/i;
      var widthMatches = this._width.toString().match(reWidth);
      if (!widthMatches) {
        throw new DeveloperError('Invalid line width: ' + this._width);
      }
      var width = parseFloat(widthMatches[1]),
          isPixels = !!widthMatches[2];
      var instanceArgs = {
        id: this.getId().replace('line', '')
      };
      var geometryArgs = {
        positions: this._cartesians,
        width: width
      };
      // PolylineGeometry has line widths in pixels. CorridorGeometry has line widths in metres.
      if (isPixels) {
        geometryArgs.vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;
        geometryArgs.colorsPerVertex = false;
        instanceArgs.geometry = new PolylineGeometry(geometryArgs);
      } else {
        geometryArgs.vertexFormat = PerInstanceColorAppearance.VERTEX_FORMAT;
        geometryArgs.cornerType = CornerType.ROUNDED;
        instanceArgs.geometry = new CorridorGeometry(geometryArgs);
      }
      instanceArgs.attributes = {
        color: ColorGeometryInstanceAttribute.fromColor(fillColor)
      };
      this._geometry = new GeometryInstance(instanceArgs);
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _createAppearance: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var isStyleDirty = this.isDirty('style');
      if ((isStyleDirty || !this._appearance) && fillColor) {
        if (this._isPolyline()) {
          this._appearance = new PolylineColorAppearance();
        } else {
          this._appearance = new PerInstanceColorAppearance({
            closed: true,
            translucent: false
          });
        }
      }
    },

    createHandle: function(vertex, index) {
      // TODO(aramk) Use a factory to use the right handle class.
      return new Handle(this._bindDependencies({target: vertex, index: index, owner: this}));
    },

    _createEntityHandle: function() {
      // Line doesn't need a handle on itself.
      return false;
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    /**
     * Adds the primitives to the scene.
     * @private
     */
    _addPrimitives: function() {
      var primitives = this._renderManager.getPrimitives();
      this._primitive && primitives.add(this._primitive);
    },

    /**
     * Removes the primitives from the scene.
     * @private
     */
    _removePrimitives: function() {
      // TODO(aramk) Removing the primitives causes a crash with "primitive was destroyed". Hiding
      // them for now.
      var primitives = this._renderManager.getPrimitives();
      if (this._primitive) {
        this._primitive.show = false;
        this._primitive = null;
        this._geometry = null;
      }
    },

    _updateVisibility: function(visible) {
      if (this._primitive) {
        this._primitive.show = visible
      }
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    },

    // -------------------------------------------
    // GETTERS & SETTERS
    // -------------------------------------------

    /**
     * @return {Boolean} Whether the geometry is a {@link PolylineGeometry}.
     */
    _isPolyline: function() {
      return this._geometry && this._geometry.geometry instanceof PolylineGeometry;
    },

    _getCesiumColors: function() {
      var style = this.getStyle();
      return Style.toCesiumColors(style);
    }

  });

  return Line;
});
