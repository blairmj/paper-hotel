'use strict';

// Coordinates identify clean material samples in the approved illustrations.
// The source images are used as texture atlases. Furniture, controls and the
// camera are independent from the artwork and keep their own depth in the room.
const InteriorArtwork = (() => {
  const SOURCES = {
    classroom: {
      image: 'rooms/interiors/classroom-approved.webp',
      samples: {
        wall:[778,136,345,34], lavender:[34,107,148,258], panel:[1236,468,29,34],
        ceiling:[787,20,109,46], floor:[1155,773,201,85],
        wood:[230,651,230,36], millwork:[252,128,42,178], door:[1420,331,108,211]
      }
    },
    music: {
      image: 'rooms/interiors/music-approved.webp',
      samples: {
        wall: [603, 278, 64, 140], ceiling: [795, 164, 106, 36],
        floor: [91, 733, 142, 102], rug: [956, 783, 138, 79],
        cloud: [669, 95, 282, 46], chair: [783, 609, 111, 89],
        walnut: [491, 419, 62, 36], deskWood: [505, 645, 40, 119],
        deskTop: [1073, 574, 67, 16], door: [1244, 350, 65, 190],
        gobo: [1474, 405, 79, 148], bench: [382, 524, 94, 10]
      }
    },
    art: {
      image: 'rooms/interiors/art-approved.webp',
      samples: {
        wall: [766, 263, 276, 109], ceiling: [670, 9, 258, 51],
        floor: [711, 763, 247, 89], wood: [760, 516, 38, 46],
        laminate: [559, 550, 72, 19], door: [1233, 340, 64, 150],
        cork: [233, 376, 76, 32], stool: [1155, 671, 65, 15],
        tile: [683, 423, 35, 37], cuttingMat: [224, 550, 49, 13]
      }
    },
    sports: {
      image: 'rooms/interiors/sports-approved.webp',
      samples: {
        wall: [780, 485, 34, 14], ceiling: [363, 87, 194, 63],
        floor: [771, 626, 108, 129], door: [369, 92, 179, 58],
        orange: [177, 425, 217, 298], blue: [1230, 406, 231, 287]
      }
    },
    computer: {
      image: 'rooms/interiors/computer-approved.webp',
      samples: {
        wall: [636, 340, 38, 86], ceiling: [890, 98, 51, 27],
        floor: [783, 658, 123, 162], door: [1191, 356, 120, 71]
      }
    },
    library: {
      image: 'rooms/interiors/library-approved.webp',
      specialty: true,
      samples: {
        wall:[1495,250,124,192], ceiling:[747,141,115,75], floor:[802,653,249,181],
        door:[1295,326,76,92], wood:[730,268,380,18], fabric:[833,352,78,79], rug:[853,560,149,22]
      }
    },
    science: {
      image: 'rooms/interiors/science-approved.webp',
      specialty: true,
      samples: {
        wall:[104,156,260,121], ceiling:[768,44,161,97], floor:[776,734,233,153],
        door:[1396,246,92,136], blue:[138,744,114,126], worktop:[157,581,99,33],
        ivory:[630,242,45,36], tile:[552,381,8,8]
      }
    },
    broadcast: {
      image: 'rooms/interiors/broadcast-approved.webp',
      specialty: true,
      samples: {
        wall:[793,228,107,31], ceiling:[712,49,69,55], floor:[643,723,447,173],
        door:[791,306,91,93], fabric:[1557,142,57,235], backdrop:[365,314,170,111],
        wood:[1576,684,53,168], red:[422,566,153,58], preview:[1324,411,97,59]
      }
    }
  };

  // The same black fabric catches different amounts of light on each wall.
  // Panel seams give each wall its own rhythm even when viewed up close.
  const STUDIO_WALL_FINISH = {
    front: {tint:'#b6a298', lift:.15, light:'#f5d8be', pools:[.22,.77], strength:.11, panelWidth:96, seams:[]},
    left: {tint:'#b9afa5', lift:.27, light:'#f3dcca', pools:[.34,.78], strength:.13, panelWidth:178, seams:[.63]},
    right: {tint:'#a3aab5', lift:.19, light:'#d4e2ef', pools:[.19,.60], strength:.16, panelWidth:121, seams:[.45,.76]},
    back: {tint:'#b9b1a7', lift:.23, light:'#eee5dc', pools:[.20,.53,.82], strength:.10, panelWidth:155, seams:[.34,.68]}
  };

  function canvasMap(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const map = new School3D.CanvasTexture(canvas);
    map.colorSpace = School3D.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }

  function wash(g, x, y, rx, ry, color, alpha) {
    g.save();
    g.translate(x, y);
    g.scale(rx, ry);
    const gradient = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(.48, color);
    gradient.addColorStop(1, 'transparent');
    g.globalAlpha = alpha;
    g.fillStyle = gradient;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  }

  function edgeShade(g, width, height, fraction, alpha) {
    for (const [x, y, x1, y1] of [
      [0, 0, width * fraction, 0], [width, 0, width * (1 - fraction), 0],
      [0, 0, 0, height * fraction], [0, height, 0, height * (1 - fraction)]
    ]) {
      const gradient = g.createLinearGradient(x, y, x1, y1);
      gradient.addColorStop(0, `rgba(24,24,24,${alpha})`);
      gradient.addColorStop(1, 'transparent');
      g.fillStyle = gradient;
      g.fillRect(0, 0, width, height);
    }
  }

  function studioWall(g, width, height, side) {
    const finish = STUDIO_WALL_FINISH[side];
    g.fillStyle = finish.tint;
    g.globalAlpha = finish.lift;
    g.fillRect(0, 0, width, height);
    g.globalAlpha = 1;

    for (const x of finish.pools) {
      wash(g, width * x, height * .12, width * .27, height * .74, finish.light, finish.strength);
    }
    const falloff = g.createLinearGradient(0, 0, 0, height);
    falloff.addColorStop(0, '#17141415');
    falloff.addColorStop(.35, '#17141400');
    falloff.addColorStop(.70, '#17141409');
    falloff.addColorStop(1, '#19161550');
    g.fillStyle = falloff;
    g.fillRect(0, 0, width, height);
    edgeShade(g, width, height, .065, .23);

    const panel = finish.panelWidth;
    for (let x = 0; x < width; x += panel) {
      const bevel = g.createLinearGradient(x, 0, x + panel, 0);
      bevel.addColorStop(0, '#14100fe0');
      bevel.addColorStop(.021, '#f7eee719');
      bevel.addColorStop(.065, '#ffffff00');
      bevel.addColorStop(.92, '#ffffff00');
      bevel.addColorStop(1, '#100e0e69');
      g.fillStyle = bevel;
      g.fillRect(x, 0, panel, height);
    }
    for (const seam of finish.seams) {
      const y = Math.round(height * seam);
      g.fillStyle = '#1816168c';
      g.fillRect(0, y, width, 2);
      g.fillStyle = '#e9e3dd23';
      g.fillRect(0, y + 2, width, 1.4);
    }
  }

  function masonry(g, image, sample, width, height) {
    const blockWidth = 59, course = 29, joint = 1.5;
    g.fillStyle = '#b2afaa';
    g.fillRect(0, 0, width, height);
    for (let row = 0; row * course < height; row++) {
      for (let col = -1; col * blockWidth < width; col++) {
        const x = (col + .5 * (row % 2)) * blockWidth, y = row * course;
        g.drawImage(image, ...sample, x + joint, y + joint, blockWidth - joint, course - joint);
        g.fillStyle = `rgba(64,61,57,${.018 * ((row * 7 + col * 5 + 17) % 5)})`;
        g.fillRect(x + joint, y + joint, blockWidth - joint, course - joint);
        g.fillStyle = '#ffffff36';
        g.fillRect(x + joint, y + joint, blockWidth - joint, 1);
      }
    }
  }

  function panelSeams(g, width, height, ceiling) {
    const spacing = ceiling ? 77 : 143;
    g.fillStyle = ceiling ? '#7c87935e' : '#7c879348';
    for (let x = 0; x < width; x += spacing) g.fillRect(x, 0, ceiling ? 2 : 1.4, height);
    if (ceiling) for (let y = 0; y < height; y += spacing) g.fillRect(0, y, width, 2);
  }

  function materialRelief(pattern) {
    let seed = 1217;
    const map = canvasMap(256,256,(g,w,h)=>{
      const image = g.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
        const grain = (seed>>>24)/255-.5;
        let shade = 128 + grain*48;
        if(pattern==='cloth')shade+=Math.cos(x*Math.PI/3)*Math.cos(y*Math.PI/3)*16;
        if(pattern==='wood')shade+=13*Math.sin(y*.86+1.4*Math.sin(x*.034))+8*Math.sin(y*.23+x*.027);
        const offset=(y*w+x)*4;
        image.data[offset]=image.data[offset+1]=image.data[offset+2]=shade;
        image.data[offset+3]=255;
      }
      g.putImageData(image,0,0);
    });
    map.colorSpace=School3D.NoColorSpace;
    return map;
  }

  async function load(kind) {
    const source = SOURCES[kind];
    const image = new Image();
    image.src = source.image;
    await image.decode();
    const atlas = imageMap(image);
    atlas.anisotropy = 8;
    const samples = new Map(), reliefs = new Map();

    function patch(region, clip) {
      const [x, y, width, height] = typeof region === 'string' ? source.samples[region] : region;
      return canvasMap(width, height, g => {
        if (clip) {
          const shape = new Path2D();
          clip(shape, width, height);
          g.clip(shape);
        }
        g.drawImage(image, x, y, width, height, 0, 0, width, height);
      });
    }

    function sample(name) {
      if (!samples.has(name)) samples.set(name, patch(name));
      return samples.get(name);
    }

    function relief(pattern) {
      if(!reliefs.has(pattern))reliefs.set(pattern,materialRelief(pattern));
      return reliefs.get(pattern);
    }

    function tile(g, name, width, height, tileWidth, tileHeight) {
      const [x, y, sw, sh] = source.samples[name];
      for (let row = 0; row * tileHeight < height; row++) {
        for (let col = 0; col * tileWidth < width; col++) {
          g.save();
          g.translate((col + col % 2) * tileWidth, (row + row % 2) * tileHeight);
          g.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1);
          g.drawImage(image, x, y, sw, sh, 0, 0, tileWidth, tileHeight);
          g.restore();
        }
      }
    }

    function ceramic(g,w,h,start=0) {
      const cell=24, [x,y,sw,sh]=source.samples.tile;
      g.fillStyle='#dfe5e8';g.fillRect(0,start,w,h-start);
      const glaze=g.createLinearGradient(0,0,0,cell);
      glaze.addColorStop(0,'#ffffff53');
      glaze.addColorStop(.16,'#ffffff10');
      glaze.addColorStop(.83,'#6a819400');
      glaze.addColorStop(1,'#6a819441');
      for(let row=0,v=start;v<h;v+=cell,row++)for(let col=0,u=0;u<w;u+=cell,col++){
        g.save();g.translate(u+.65,v+.65);
        g.drawImage(image,x,y,sw,sh,0,0,cell-1.3,cell-1.3);
        g.fillStyle='rgba(72,105,129,'+((col*7+row*9)%11)*.006+')';
        g.fillRect(0,0,cell-1.3,cell-1.3);
        g.fillStyle=glaze;g.fillRect(0,0,cell-1.3,cell-1.3);
        g.restore();
      }
    }

    function libraryPlanks(g,w,h) {
      const shades = ['#d7aa7c','#e7be94','#dbb087','#edc49b','#dcb48f','#e7c09e','#deb087'];
      const plank=33, length=204;
      for(let i=0;i*plank<w;i++)for(let j=-1;j*length<h;j++){
        const x=i*plank, y=j*length+(i*79)%length;
        g.fillStyle=shades[(i*11+(j+1)*3)%shades.length];
        g.fillRect(x,y,plank,length);
        g.globalAlpha=.36;
        g.drawImage(image,804+(i%3)*18,657+(i%5)*7,27,147,x,y,plank,length);
        g.globalAlpha=1;
        g.fillStyle='#78553849';g.fillRect(x,y,.8,length);g.fillRect(x,y,plank,.8);
        g.fillStyle='#fff2d456';g.fillRect(x+1,y+1,.7,length-1);
      }
      wash(g,w*.49,h*.54,w*.78,h*.78,'#fff4dc',.21);
    }

    function specialtySurface(g,name,w,h) {
      if(name==='tile'){ceramic(g,w,h);return}
      if(name==='floor'&&kind==='library')libraryPlanks(g,w,h);
      else tile(g,name,w,h,...(name==='floor'?[235,146]:[412,305]));
      if(kind==='science'&&name==='wall')ceramic(g,w,h,Math.round(h-1.14*128));
      if(name==='wall'){
        const light=kind==='library'?'#fff2d2':'#fff9ef';
        for(const x of [.26,.75])wash(g,w*x,h*.22,w*.37,h*.58,light,.26);
      }
      if(name==='ceiling'){
        for(const x of [.25,.75])for(const y of [.19,.49,.79]){
          wash(g,w*x,h*y,w*.29,h*.28,kind==='library'?'#fff0d8':'#fffaf3',.27);
        }
      }
      edgeShade(g,w,h,name==='floor'?.12:.108,name==='floor'?.21:.22);
    }

    function surface(name, metresWide, metresDeep, side = 'front') {
      const music = kind === 'music';
      const sports = kind === 'sports', computer = kind === 'computer';
      const width = Math.ceil(128 * metresWide);
      const height = Math.ceil(128 * metresDeep);
      return canvasMap(width, height, (g, w, h) => {
        if(source.specialty){specialtySurface(g,name,w,h);return}
        const repeats = {
          wall: music ? [112, 236] : [298, 154],
          ceiling: [233, 125],
          floor: [195, 154],
          rug: [136, 92],
          cloud: [160, 75]
        };
        if (sports && name === 'wall') masonry(g, image, source.samples.wall, w, h);
        else tile(g, name, w, h, ...repeats[name]);
        if (computer && (name === 'wall' || name === 'ceiling')) panelSeams(g, w, h, name === 'ceiling');
        if (name === 'wall') {
          if (music) {
            studioWall(g, w, h, side);
            return;
          }
          const light = g.createLinearGradient(0, 0, 0, h);
          light.addColorStop(0, '#3444482e');
          light.addColorStop(.31, '#ffffff02');
          light.addColorStop(.72, '#ffffff02');
          light.addColorStop(1, '#34444849');
          g.fillStyle = light;
          g.fillRect(0, 0, w, h);
          edgeShade(g, w, h, .09, .12);
          if (!sports && !computer && (side === 'left' || side === 'right')) {
            g.fillStyle = '#45626112';
            g.fillRect(0, 0, w, h);
          }
          if (side === 'front') {
            wash(g, w * .20, h * .16, w * .18, h * .50, '#f5faff', .17);
            wash(g, w * .75, h * .13, w * .17, h * .50, '#f6f9ff', .22);
          }
        }
        if (name === 'ceiling') {
          edgeShade(g, w, h, .18, .19);
          for (const x of [.25, .50, .74]) {
            wash(g, w * x, h * .24, w * .25, h * .49, music ? '#ffe6d2' : '#ffffff', music ? .18 : .28);
            wash(g, w * x, h * .69, w * .27, h * .39, music ? '#ffe9d3' : '#ffffff', .19);
          }
        }
        if (name === 'floor') {
          edgeShade(g, w, h, .067, .24);
          const floorLight = music ? '#ebc8a9' : sports ? '#ece7e0' : '#f3f8f8';
          for (const x of [.18, .46, .73, .91]) {
            wash(g, w * x, h * .22, w * (music ? .07 : .19), h * .27, floorLight, music ? .25 : .24);
          }
          wash(g, w * .5, h * .68, w * .52, h * .55, music ? '#c8b3aa' : '#e5ecec', .25);
        }
      });
    }

    function facePixels(corners, pixels) {
      const geo = new School3D.BufferGeometry();
      geo.setAttribute('position', new School3D.Float32BufferAttribute(corners.flat(), 3));
      geo.setAttribute('uv', new School3D.Float32BufferAttribute(
        pixels.flatMap(([x, y]) => [x / image.width, 1 - y / image.height]), 2
      ));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.computeVertexNormals();
      return new School3D.Mesh(geo, new School3D.MeshBasicMaterial({map:atlas, side:School3D.DoubleSide}));
    }

    return {patch, sample, surface, facePixels, relief};
  }

  return {load, canvasMap};
})();
