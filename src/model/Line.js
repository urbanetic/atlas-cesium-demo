define([
  'atlas/model/Line',
  'atlas-cesium/model/Colour',
  'atlas-cesium/model/Handle',
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
], function(LineCore, Colour, Handle, GeometryInstance, CorridorGeometry, PolylineGeometry,
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

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    _build: function() {
      if (!this._primitive || this.isDirty('vertices') || this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }
      this._super();
    },

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _updateGeometry: function() {
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        Log.debug('updating geometry for entity ' + this.getId());
        this._cartesians = this._renderManager.cartesianArrayFromGeoPointArray(this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
      }

      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      // TODO(bpstudds): Add support for different colours per line segment.

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
      // Allow colour as fill or border, since it's just a line.
      var colour = this._style.getFillColour() || this._style.getBorderColour();

      // PolylineGeometry has line widths in pixels. CorridorGeometry has line widths in metres.
      if (isPixels) {
        geometryArgs.vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;
        geometryArgs.colors = this._cartesians.map(function() {
          return colour;
        }, this);
        geometryArgs.colorsPerVertex = false;
        instanceArgs.geometry = new PolylineGeometry(geometryArgs);
      } else {
        geometryArgs.vertexFormat = PerInstanceColorAppearance.VERTEX_FORMAT;
        geometryArgs.cornerType = CornerType.ROUNDED;
        instanceArgs.attributes = {
          color: ColorGeometryInstanceAttribute.fromColor(Colour.toCesiumColor(colour))
        };
        instanceArgs.geometry = new CorridorGeometry(geometryArgs);
      }
      return new GeometryInstance(instanceArgs);
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style')) {
        Log.debug('updating appearance for entity ' + this.getId());
        if (!this._appearance) {
          if (this._isPolyline()) {
            this._appearance = new PolylineColorAppearance();
          } else {
            this._appearance = new PerInstanceColorAppearance({
              closed: true,
              translucent: false
            });
          }
        }
      }
      return this._appearance;
    },

    _isPolyline: function() {
      return this._geometry.geometry instanceof PolylineGeometry;
    },

    _updateVisibility: function (visible) {
      if (this._primitive) this._primitive.show = visible;
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    },

    setStyle: function(style) {
      this._super(style);
      // Force a redraw of the model to ensure color change takes affect, since the
      // ColorGeometryInstanceAttribute is bound per instance.
      this.setDirty('model');
      this.isVisible() && this.show();
    },

    modifyStyle: function(newStyle) {
      // Force a redraw of the model to ensure color change takes affect, since the
      // ColorGeometryInstanceAttribute is bound per instance.
      this.setDirty('model');
      return this._super(newStyle);
    },

    // -------------------------------------------
    // CONSTRUCTION
    // -------------------------------------------

    _createPrimitive: function() {
      Log.debug('creating primitive for entity', this.getId());
      // TODO(aramk) _geometry isn't actually set.
      this._geometry = this._updateGeometry();
      this._appearance = this._updateAppearance();
      return new Primitive({
        geometryInstances: this.getGeometry(),
        appearance: this.getAppearance()
      });
    },

    createHandle: function(vertex, index) {
      // TODO(aramk) Use a factory to use the right handle class.
      return new Handle(this._bindDependencies({target: vertex, index: index, owner: this}));
    },

    _createEntityHandle: function () {
      // Line doesn't need a handle on itself.
      return false;
    }

  });

  return Line;
});
