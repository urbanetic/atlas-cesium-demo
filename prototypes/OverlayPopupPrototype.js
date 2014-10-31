define([
  'atlas/lib/utility/Class',
  'atlas/model/Colour',
  'atlas/dom/Overlay'
], function(Class, Colour, Overlay) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var domNode = atlas._managers.dom.getDom();

      // atlas.subscribe('entity/selection/change', function (args) {
      //   console.log('selection', args);
      // });

      var currentOverlay,
        width = 300,
        height = 100,
        yBuffer = 10,
        renderManager = atlas._managers.render;
      atlas.subscribe('entity/select', function(args) {
        var id = args.ids[0];
        var entity = atlas._managers.entity.getById(id);
        var centroid = entity.getCentroid();
        var elevation = entity.getElevation() + entity.getHeight();

        // Find all points from the bounding box and convert to screen coordinates. Use this to
        // ensure the overlay doesn't overlap the entity.
        var bBox = entity.getBoundingBox();
        var cornerYs = [];
        bBox.getCorners().forEach(function (corner) {
          corner.elevation = elevation;
          cornerYs.push(renderManager.screenCoordsFromGeoPoint(corner).y);
        });
        var minY = Math.min.apply(null, cornerYs);
        var screenCoord = renderManager.screenCoordsFromGeoPoint(centroid);
        console.log('centroid screenCoord', screenCoord);
        screenCoord.y = minY - yBuffer;
        console.log('new screenCoord', screenCoord);
        var position = {
          left: screenCoord.x - width / 2,
          top: screenCoord.y - height
        };
        console.log('position', position);
        currentOverlay && currentOverlay.remove();
        currentOverlay = new Overlay({
          content: 'Overlay',
          parent: domNode,
          position: position,
          dimensions: {
            height: height,
            width: width
          }
        });
        // TODO(aramk) Ensure the overlay is within the bounds of the window.
        console.log('select', currentOverlay, entity);
      });

      atlas.subscribe('entity/deselect', function(args) {
        currentOverlay && currentOverlay.remove();
      });

    }

  });
});