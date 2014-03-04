define([
  'atlas/model/Line',
  'atlas/model/Style',
  'atlas/model/Colour',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolylineGeometry',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  //'atlas-cesium/cesium/Source/Core/SimplePolylineGeometry',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/model/Polygon',
  'atlas/lib/utility/Log'
], function(Line, Style, Colour, GeometryInstance, PolylineGeometry, Primitive, MaterialAppearance,
            Polygon, Log) {
  "use strict";
  /**
   * @class atlas-cesium.model.Line
   * @extends atlas.model.Line
   */
  return Line.extend(/** @lends atlas-cesium.model.Line# */{

    // TODO(aramk) Refactor this wth Polygon and Mesh, a lot of building logic is very similar.

    /**
     * The Cesium GeometryInstance of the Polygon.
     * @type {GeometryInstance}
     * @private
     */
    _geometry: null,

    /**
     * The Cesium appearance data of the Polygon.
     * @type {EllipsoidSurfaceAppearance|MaterialAppearance}
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

    // TODO(aramk) Not sure if this is working or not, but I can't see anything through manual
    // testing so I'm leaving this for now. This needs a lot of refactoring with Polygon and Mesh.

    _build: function() {
      if (!this._primitive || this.isDirty('vertices') || this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager._widget.scene.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }
      this.clean();
    },

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

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _updateGeometry: function() {
      var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();

      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        Log.debug('updating geometry for entity ' + this.getId());
        this._cartesians = Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);

//        // For 3D extruded polygons, ensure polygon is not closed as it causes
//        // rendering to hang.
//        if (this._height > 0) {
//          if (this._cartesians[0] === this._cartesians[this._cartesians.length - 1]) {
//            this._cartesians.pop();
//          }
//        }
      }

//      var polyline = new SimplePolylineGeometry({
//        positions: Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices),
//        colors: Polygon._convertStyleToCesiumColors(this._style)
//      });
//      var geometry = SimplePolylineGeometry.createGeometry(polyline);

      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      var elevation = this._minTerrainElevation;/* + this._elevation +
          this._zIndex * this._zIndexOffset;*/

      // Generate geometry data.
      return new GeometryInstance({
        id: this.getId().replace('line', ''),
        geometry: PolylineGeometry.fromPositions({
          positions: this._cartesians,
          height: elevation,
          width: 5
        })
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
          // TODO(bpstudds): Fix rendering so that 'closed' can be enabled.
          //                 This may require sorting of vertices before rendering.
          this._appearance = new MaterialAppearance({
            closed: false,
            translucent: false,
            faceForward: true
          });
        }
        this._appearance.material.uniforms.color =
            Polygon._convertStyleToCesiumColors(this._style).fill;
      }
      return this._appearance;
    },

//    _build: function() {
//      var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();
//      var polyline = new SimplePolylineGeometry({
//        positions: Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices),
//        colors: Polygon._convertStyleToCesiumColors(this._style)
//      });
//      this._geometry = SimplePolylineGeometry.createGeometry(polyline);
//
//      this.clean();
//    },

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
      return !!(this._primitive && this._primitive.show);
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
      this._primitive && this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
    }

  });
});
