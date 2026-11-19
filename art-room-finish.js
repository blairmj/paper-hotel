'use strict';

const ArtRoomFinish = (() => {
  // Order follows the wall UVs clockwise from the front-left corner.
  const panels = [
    {side:'front', file:'art-mural-front.webp', shelf:[.810,.902]},
    {side:'right', file:'art-wall-mural.png?v=chaekgeori28', shelf:[.792,.909]},
    {side:'back', file:'art-mural-back.webp', shelf:[.813,.919]},
    {side:'left', file:'art-mural-left.webp', shelf:[.792,.908]}
  ];
  const shelfHeight = panels[1].shelf;
  const resolution = 192;

  async function loadPanel(file) {
    const image = new Image();
    image.src = 'rooms/interiors/' + file;
    await image.decode();
    return image;
  }

  function wallTexture(image, width, height, shelf) {
    const rows = (height, shelf) => [0, ...shelf.map(ratio => Math.round(height * ratio)), height];
    const source = rows(image.naturalHeight, shelf), target = rows(height, shelfHeight);
    return InteriorArtwork.canvasMap(width, height, g => {
      // Align both painted edges of the shelf across all room corners.
      for (let i = 0; i < source.length - 1; i++) {
        g.drawImage(image, 0, source[i], image.naturalWidth, source[i + 1] - source[i],
          0, target[i], width, target[i + 1] - target[i]);
      }
    });
  }

  function edgeLayer(panel, fromRight, width) {
    const strip = document.createElement('canvas');
    strip.width = width;
    strip.height = panel.height;
    const g = strip.getContext('2d');
    if (fromRight) {
      g.translate(width, 0);
      g.scale(-1, 1);
    }
    const x = fromRight ? panel.width - width : 0;
    g.drawImage(panel, x, 0, width, panel.height, 0, 0, width, panel.height);
    g.resetTransform();
    g.globalCompositeOperation = 'destination-in';
    const blend = g.createLinearGradient(.5, 0, width - .5, 0);
    blend.addColorStop(0, '#0008');
    blend.addColorStop(1, 'transparent');
    g.fillStyle = blend;
    g.fillRect(0, 0, width, panel.height);
    return strip;
  }

  function blendCorner(previous, next) {
    // Feather neighbouring paint at the crease at its original scale.
    const width = Math.round(resolution * .15);
    const previousEdge = edgeLayer(previous, true, width);
    const nextEdge = edgeLayer(next, false, width);
    const join = document.createElement('canvas');
    join.width = 1;
    join.height = previous.height;
    const shared = join.getContext('2d');
    shared.drawImage(previous, previous.width - 1, 0, 1, join.height, 0, 0, 1, join.height);
    shared.globalAlpha = .5;
    shared.drawImage(next, 0, 0, 1, join.height, 0, 0, 1, join.height);

    const end = previous.getContext('2d');
    end.save();
    end.translate(previous.width, 0);
    end.scale(-1, 1);
    end.drawImage(nextEdge, 0, 0);
    end.drawImage(join, 0, 0);
    end.restore();

    const start = next.getContext('2d');
    start.drawImage(previousEdge, 0, 0);
    start.drawImage(join, 0, 0);
  }

  function birchFloor(width, depth) {
    return InteriorArtwork.canvasMap(Math.ceil(width * 128), Math.ceil(depth * 128), (g, w, h) => {
      const boardDepth = 38, boardLength = 372;
      const tones = ['#f0dfc5','#f3e4ce','#edddc4','#f2e0c7','#ebdac0','#f3e1c8'];
      for (let row = 0; row * boardDepth < h; row++) {
        const y = row * boardDepth;
        for (let board = 0; board * boardLength < w + boardLength; board++) {
          const x = board * boardLength - (row % 4) * 93;
          g.fillStyle = tones[(row * 7 + board * 11) % tones.length];
          g.fillRect(x, y, boardLength, boardDepth);
          g.fillStyle = '#9b815322';
          g.fillRect(x, y, 1, boardDepth);
        }
        g.fillStyle = '#95794b30';
        g.fillRect(0, y, w, 1);
      }
      const light = g.createRadialGradient(w * .49, h * .47, 30, w * .49, h * .47, w * .65);
      light.addColorStop(0, '#fff8e12e');
      light.addColorStop(1, '#d6b68e24');
      g.fillStyle = light;
      g.fillRect(0, 0, w, h);
    });
  }

  function paintMap(top, bottom) {
    return InteriorArtwork.canvasMap(192, 256, (g,w,h) => {
      const paint = g.createLinearGradient(0, 0, 0, h);
      paint.addColorStop(0, top);
      paint.addColorStop(1, bottom);
      g.fillStyle = paint;
      g.fillRect(0, 0, w, h);
    });
  }

  async function load(room) {
    const [artwork, ...images] = await Promise.all([
      InteriorArtwork.load('art'), ...panels.map(({file}) => loadPanel(file))
    ]);
    const {width, height} = room.wall;
    const rows = Math.round(height * resolution);
    const textures = panels.map(({side,shelf}, i) => {
      const span = side === 'front' || side === 'back' ? width : room.depth;
      return wallTexture(images[i], Math.round(span * resolution), rows, shelf);
    });
    for (let i = 0; i < textures.length; i++) {
      blendCorner(textures[i].image, textures[(i + 1) % textures.length].image);
    }
    const walls = Object.fromEntries(panels.map(({side}, i) => [side, textures[i]]));
    const ceiling = paintMap('#fffaf1', '#f7efe5'), door = paintMap('#397cc5', '#2d5f9b');
    return {
      ...artwork,
      wrapWalls: true,
      sample(name) { return name === 'door' ? door : artwork.sample(name); },
      surface(name, w, d, side) {
        if (name === 'wall') return walls[side];
        if (name === 'ceiling') return ceiling;
        if (name === 'floor') return birchFloor(w, d);
        return artwork.surface(name, w, d, side);
      }
    };
  }

  return {load};
})();
