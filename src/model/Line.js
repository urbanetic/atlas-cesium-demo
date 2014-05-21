define([
  'atlas/model/Line',
  'atlas-cesium/model/Colour',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/CorridorGeometry',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/CornerType',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/model/Polygon',
  'atlas/lib/utility/Log'
], function(LineCore, Colour, Handle, GeometryInstance, CorridorGeometry,
            ColorGeometryInstanceAttribute, CornerType, Primitive, PerInstanceColorAppearance,
            Polygon, Log) {
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
     * @type {Cartesian3}
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
      this.clean();
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
        this._cartesians = this._renderManager.cartesianArrayFromVertexArray(this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
      }

      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      // TODO(bpstudds): Add support for different colours per line segment.

      // Generate geometry data.
      // NOTE: CorridorGeometry was used in place of PolylineGeometry to ensure line widths were
      // in metres and resized with zooming the globe.
      return new GeometryInstance({
        id: this.getId().replace('line', ''),
        geometry: new CorridorGeometry({
          positions: this._cartesians,
          width: this._width,
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
          cornerType: CornerType.ROUNDED
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(Colour.toCesiumColor(this._style.getBorderColour()))
        }
      });
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style')) {
        Log.debug('updating appearance for entity ' + this.getId());
        if (!this._appearance) {
          this._appearance = new PerInstanceColorAppearance({
            closed: true,
            translucent: false
          });
        }
      }
      return this._appearance;
    },

    show: function() {
      if (this.isVisible() && this.isRenderable()) {
        Log.debug('entity ' + this.getId() + ' already visible and correctly rendered');
      } else {
        Log.debug('showing entity ' + this.getId());
        if (!this.isRenderable()) {
          this._build();
        }
      }
      return this.isRenderable() && this.isVisible();
    },

    /**
     * Returns whether this Polygon is visible. Overrides the default Atlas implementation
     * to use the visibility flag that is set of the Cesium Primitive of the Polygon.
     * @returns {Boolean} - Whether the Polygon is visible.
     */
    isVisible: function() {
      return this._primitive && this._primitive.show === true;
    },

    /**
     * Hides the Polygon.
     * @returns {Boolean} Whether the polygon is hidden.
     */
    hide: function() {
      if (this.isVisible()) {
        Log.debug('hiding entity ' + this.getId());
        this._primitive.show = false;
      }
      return !this.isVisible();
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
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

    createHandles: function() {
      return this._vertices.forEach(function(vertex) {
        return this.createHandle(vertex);
      }, this);
    },

    createHandle: function(vertex) {
      return new Handle({linked: vertex, target: this});
    }

  });

  return Line;
});
