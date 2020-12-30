import { Vector3 } from "three";

import {
  View3d,
  Volume,
  VolumeMaker,
  VolumeLoader,
  Light,
  AREA_LIGHT,
  RENDERMODE_PATHTRACE,
  RENDERMODE_RAYMARCH,
  SKY_LIGHT,
} from "../src";

let view3D = null;

const myState = {
  file: "",
  volume: null,
  density: 12.5,
  maskAlpha: 1.0,
  exposure: 0.75,
  aperture: 0.0,
  fov: 20,
  focal_distance: 4.0,

  lights: [new Light(SKY_LIGHT), new Light(AREA_LIGHT)],

  skyTopIntensity: 0.3,
  skyMidIntensity: 0.3,
  skyBotIntensity: 0.3,
  skyTopColor: [255, 255, 255],
  skyMidColor: [255, 255, 255],
  skyBotColor: [255, 255, 255],

  lightColor: [255, 255, 255],
  lightIntensity: 75.0,
  lightTheta: 14, //deg
  lightPhi: 54, //deg

  xmin: 0.0,
  ymin: 0.0,
  zmin: 0.0,
  xmax: 1.0,
  ymax: 1.0,
  zmax: 1.0,

  samplingRate: 0.25,
  primaryRay: 1.0,
  secondaryRay: 1.0,

  isPT: false,

  isTurntable: false,
  isAxisShowing: false,
  isAligned: true,

  flipX: 1,
  flipY: 1,
  flipZ: 1,
};

// controlPoints is array of [{offset:number, color:cssstring}]
// where offset is a value from 0.0 to 1.0, and color is a string encoding a css color value.
// first and last control points should be at offsets 0 and 1
// TODO: what if offsets 0 and 1 are not provided?
// makeColorGradient([
//    {offset:0, color:"black"},
//    {offset:0.2, color:"black"},
//    {offset:0.25, color:"red"},
//    {offset:0.5, color:"orange"}
//    {offset:1.0, color:"yellow"}
//]);
/*
function makeColorGradient(controlPoints) {
  const c = document.createElement("canvas");
  c.style.height = 1;
  c.style.width = 256;
  c.height = 1;
  c.width = 256;

  const ctx = c.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 255, 0);
  if (!controlPoints.length || controlPoints.length < 1) {
    console.log("warning: bad control points submitted to makeColorGradient; reverting to linear greyscale gradient");
    grd.addColorStop(0, "black");
    grd.addColorStop(1, "white");
  } else {
    // what if none at 0 and none at 1?
    for (let i = 0; i < controlPoints.length; ++i) {
      grd.addColorStop(controlPoints[i].offset, controlPoints[i].color);
    }
  }

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 1);
  const imgData = ctx.getImageData(0, 0, 256, 1);
  // console.log(imgData.data);
  return imgData.data;
}
*/
function initLights() {
  myState.lights[0].m_colorTop = new Vector3(
    (myState.skyTopColor[0] / 255.0) * myState.skyTopIntensity,
    (myState.skyTopColor[1] / 255.0) * myState.skyTopIntensity,
    (myState.skyTopColor[2] / 255.0) * myState.skyTopIntensity
  );
  myState.lights[0].m_colorMiddle = new Vector3(
    (myState.skyMidColor[0] / 255.0) * myState.skyMidIntensity,
    (myState.skyMidColor[1] / 255.0) * myState.skyMidIntensity,
    (myState.skyMidColor[2] / 255.0) * myState.skyMidIntensity
  );
  myState.lights[0].m_colorBottom = new Vector3(
    (myState.skyBotColor[0] / 255.0) * myState.skyBotIntensity,
    (myState.skyBotColor[1] / 255.0) * myState.skyBotIntensity,
    (myState.skyBotColor[2] / 255.0) * myState.skyBotIntensity
  );
  myState.lights[1].m_theta = (myState.lightTheta * Math.PI) / 180.0;
  myState.lights[1].m_phi = (myState.lightPhi * Math.PI) / 180.0;
  myState.lights[1].m_color = new Vector3(
    (myState.lightColor[0] / 255.0) * myState.lightIntensity,
    (myState.lightColor[1] / 255.0) * myState.lightIntensity,
    (myState.lightColor[2] / 255.0) * myState.lightIntensity
  );
  view3D.updateLights(myState.lights);
}

let gui = null;

function setupGui() {
  // eslint-disable-next-line no-undef
  gui = new dat.GUI();
  //gui = new dat.GUI({autoPlace:false, width:200});

  let obj = { tiff: 'AICS-10_5_13.ome.tif'}
  let tiffDropdown = gui.add( obj, 'tiff', ['AICS-10_5_13.ome.tif', 'AICS-10_5_14.ome.tif'] )
  // let omeFolder = gui.addFolder('Ome.tiff');
  // omeFolder.add(ometiffs, 'name')
  gui
    .add(myState, "density")
    .max(100.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateDensity(myState.volume, value / 50.0);
    });
  gui
    .add(myState, "maskAlpha")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateMaskAlpha(myState.volume, value);
    });
  gui
    .add(myState, "primaryRay")
    .max(40.0)
    .min(1.0)
    .step(0.1)
    .onChange(function(value) {
      view3D.setRayStepSizes(myState.volume, myState.primaryRay, myState.secondaryRay);
    });
  gui
    .add(myState, "secondaryRay")
    .max(40.0)
    .min(1.0)
    .step(0.1)
    .onChange(function(value) {
      view3D.setRayStepSizes(myState.volume, myState.primaryRay, myState.secondaryRay);
    });

  var cameragui = gui.addFolder("Camera");
  cameragui
    .add(myState, "exposure")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateExposure(value);
    });
  cameragui
    .add(myState, "aperture")
    .max(0.1)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateCamera(myState.fov, myState.focal_distance, myState.aperture);
    });
  cameragui
    .add(myState, "focal_distance")
    .max(5.0)
    .min(0.1)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateCamera(myState.fov, myState.focal_distance, myState.aperture);
    });
  cameragui
    .add(myState, "fov")
    .max(90.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateCamera(myState.fov, myState.focal_distance, myState.aperture);
    });
  cameragui
    .add(myState, "samplingRate")
    .max(1.0)
    .min(0.1)
    .step(0.001)
    .onChange(function(value) {
      view3D.updatePixelSamplingRate(value);
    });

  var clipping = gui.addFolder("Clipping Box");
  clipping
    .add(myState, "xmin")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });
  clipping
    .add(myState, "xmax")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });
  clipping
    .add(myState, "ymin")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });
  clipping
    .add(myState, "ymax")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });
  clipping
    .add(myState, "zmin")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });
  clipping
    .add(myState, "zmax")
    .max(1.0)
    .min(0.0)
    .step(0.001)
    .onChange(function(value) {
      view3D.updateClipRegion(
        myState.volume,
        myState.xmin,
        myState.xmax,
        myState.ymin,
        myState.ymax,
        myState.zmin,
        myState.zmax
      );
    });

  var lighting = gui.addFolder("Lighting");
  lighting
    .addColor(myState, "skyTopColor")
    .name("Sky Top")
    .onChange(function(value) {
      myState.lights[0].m_colorTop = new Vector3(
        (myState.skyTopColor[0] / 255.0) * myState.skyTopIntensity,
        (myState.skyTopColor[1] / 255.0) * myState.skyTopIntensity,
        (myState.skyTopColor[2] / 255.0) * myState.skyTopIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "skyTopIntensity")
    .max(100.0)
    .min(0.01)
    .step(0.1)
    .onChange(function(value) {
      myState.lights[0].m_colorTop = new Vector3(
        (myState.skyTopColor[0] / 255.0) * myState.skyTopIntensity,
        (myState.skyTopColor[1] / 255.0) * myState.skyTopIntensity,
        (myState.skyTopColor[2] / 255.0) * myState.skyTopIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .addColor(myState, "skyMidColor")
    .name("Sky Mid")
    .onChange(function(value) {
      myState.lights[0].m_colorMiddle = new Vector3(
        (myState.skyMidColor[0] / 255.0) * myState.skyMidIntensity,
        (myState.skyMidColor[1] / 255.0) * myState.skyMidIntensity,
        (myState.skyMidColor[2] / 255.0) * myState.skyMidIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "skyMidIntensity")
    .max(100.0)
    .min(0.01)
    .step(0.1)
    .onChange(function(value) {
      myState.lights[0].m_colorMiddle = new Vector3(
        (myState.skyMidColor[0] / 255.0) * myState.skyMidIntensity,
        (myState.skyMidColor[1] / 255.0) * myState.skyMidIntensity,
        (myState.skyMidColor[2] / 255.0) * myState.skyMidIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .addColor(myState, "skyBotColor")
    .name("Sky Bottom")
    .onChange(function(value) {
      myState.lights[0].m_colorBottom = new Vector3(
        (myState.skyBotColor[0] / 255.0) * myState.skyBotIntensity,
        (myState.skyBotColor[1] / 255.0) * myState.skyBotIntensity,
        (myState.skyBotColor[2] / 255.0) * myState.skyBotIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "skyBotIntensity")
    .max(100.0)
    .min(0.01)
    .step(0.1)
    .onChange(function(value) {
      myState.lights[0].m_colorBottom = new Vector3(
        (myState.skyBotColor[0] / 255.0) * myState.skyBotIntensity,
        (myState.skyBotColor[1] / 255.0) * myState.skyBotIntensity,
        (myState.skyBotColor[2] / 255.0) * myState.skyBotIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState.lights[1], "m_distance")
    .max(10.0)
    .min(0.0)
    .step(0.1)
    .onChange(function(value) {
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "lightTheta")
    .max(180.0)
    .min(-180.0)
    .step(1)
    .onChange(function(value) {
      myState.lights[1].m_theta = (value * Math.PI) / 180.0;
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "lightPhi")
    .max(180.0)
    .min(0.0)
    .step(1)
    .onChange(function(value) {
      myState.lights[1].m_phi = (value * Math.PI) / 180.0;
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState.lights[1], "m_width")
    .max(100.0)
    .min(0.01)
    .step(0.1)
    .onChange(function(value) {
      myState.lights[1].m_width = value;
      myState.lights[1].m_height = value;
      view3D.updateLights(myState.lights);
    });
  lighting
    .add(myState, "lightIntensity")
    .max(1000.0)
    .min(0.01)
    .step(0.1)
    .onChange(function(value) {
      myState.lights[1].m_color = new Vector3(
        (myState.lightColor[0] / 255.0) * myState.lightIntensity,
        (myState.lightColor[1] / 255.0) * myState.lightIntensity,
        (myState.lightColor[2] / 255.0) * myState.lightIntensity
      );
      view3D.updateLights(myState.lights);
    });
  lighting
    .addColor(myState, "lightColor")
    .name("lightcolor")
    .onChange(function(value) {
      myState.lights[1].m_color = new Vector3(
        (myState.lightColor[0] / 255.0) * myState.lightIntensity,
        (myState.lightColor[1] / 255.0) * myState.lightIntensity,
        (myState.lightColor[2] / 255.0) * myState.lightIntensity
      );
      view3D.updateLights(myState.lights);
    });

  initLights();
}

//eslint-disable-next-line no-undef
dat.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
};

function showChannelUI(volume) {
  if (myState && myState.channelFolderNames) {
    for (let i = 0; i < myState.channelFolderNames.length; ++i) {
      gui.removeFolder(myState.channelFolderNames[i]);
    }
  }

  myState.infoObj = volume.imageInfo;

  myState.infoObj.channelGui = [];

  myState.channelFolderNames = [];
  for (let i = 0; i < myState.infoObj.channels; ++i) {
    myState.infoObj.channelGui.push({
      colorD: volume.channel_colors_default[i],
      colorS: [0, 0, 0],
      colorE: [0, 0, 0],
      window: 1.0,
      level: 0.5,
      glossiness: 0.0,
      isovalue: 128, // actual intensity value
      isosurface: false,
      // first 3 channels for starters
      enabled: i < 3,
      // this doesn't give good results currently but is an example of a per-channel button callback
      autoIJ: (function(j) {
        return function() {
          const lut = volume.getHistogram(j).lutGenerator_auto2();
          // TODO: get a proper transfer function editor
          // const lut = { lut: makeColorGradient([
          //     {offset:0, color:"black"},
          //     {offset:0.2, color:"black"},
          //     {offset:0.25, color:"red"},
          //     {offset:0.5, color:"orange"},
          //     {offset:1.0, color:"yellow"}])
          // };
          volume.setLut(j, lut.lut);
          view3D.updateLuts(volume);
        };
      })(i),
      // this doesn't give good results currently but is an example of a per-channel button callback
      auto0: (function(j) {
        return function() {
          const lut = volume.getHistogram(j).lutGenerator_auto();
          volume.setLut(j, lut.lut);
          view3D.updateLuts(volume);
        };
      })(i),
      // this doesn't give good results currently but is an example of a per-channel button callback
      bestFit: (function(j) {
        return function() {
          const lut = volume.getHistogram(j).lutGenerator_bestFit();
          volume.setLut(j, lut.lut);
          view3D.updateLuts(volume);
        };
      })(i),
      pct50_98: (function(j) {
        return function() {
          const lut = volume.getHistogram(j).lutGenerator_percentiles(0.5, 0.998);
          volume.setLut(j, lut.lut);
          view3D.updateLuts(volume);
        };
      })(i),
    });
    var f = gui.addFolder("Channel " + myState.infoObj.channel_names[i]);
    myState.channelFolderNames.push("Channel " + myState.infoObj.channel_names[i]);
    f.add(myState.infoObj.channelGui[i], "enabled").onChange(
      (function(j) {
        return function(value) {
          view3D.setVolumeChannelEnabled(volume, j, value ? true : false);
          view3D.updateActiveChannels(volume);
        };
      })(i)
    );
    f.add(myState.infoObj.channelGui[i], "isosurface").onChange(
      (function(j) {
        return function(value) {
          if (value) {
            view3D.createIsosurface(volume, j, myState.infoObj.channelGui[j].isovalue, 1.0);
          } else {
            view3D.clearIsosurface(volume, j);
          }
        };
      })(i)
    );
    f.add(myState.infoObj.channelGui[i], "isovalue")
      .max(255)
      .min(0)
      .step(1)
      .onChange(
        (function(j) {
          return function(value) {
            view3D.updateIsosurface(volume, j, value);
          };
        })(i)
      );

    f.addColor(myState.infoObj.channelGui[i], "colorD")
      .name("Diffuse")
      .onChange(
        (function(j) {
          return function(value) {
            view3D.updateChannelMaterial(
              volume,
              j,
              myState.infoObj.channelGui[j].colorD,
              myState.infoObj.channelGui[j].colorS,
              myState.infoObj.channelGui[j].colorE,
              myState.infoObj.channelGui[j].glossiness
            );
            view3D.updateMaterial(volume);
          };
        })(i)
      );
    f.addColor(myState.infoObj.channelGui[i], "colorS")
      .name("Specular")
      .onChange(
        (function(j) {
          return function(value) {
            view3D.updateChannelMaterial(
              volume,
              j,
              myState.infoObj.channelGui[j].colorD,
              myState.infoObj.channelGui[j].colorS,
              myState.infoObj.channelGui[j].colorE,
              myState.infoObj.channelGui[j].glossiness
            );
            view3D.updateMaterial(volume);
          };
        })(i)
      );
    f.addColor(myState.infoObj.channelGui[i], "colorE")
      .name("Emissive")
      .onChange(
        (function(j) {
          return function(value) {
            view3D.updateChannelMaterial(
              volume,
              j,
              myState.infoObj.channelGui[j].colorD,
              myState.infoObj.channelGui[j].colorS,
              myState.infoObj.channelGui[j].colorE,
              myState.infoObj.channelGui[j].glossiness
            );
            view3D.updateMaterial(volume);
          };
        })(i)
      );
    f.add(myState.infoObj.channelGui[i], "window")
      .max(1.0)
      .min(0.0)
      .step(0.001)
      .onChange(
        (function(j) {
          return function(value) {
            volume.getChannel(j).lutGenerator_windowLevel(value, myState.infoObj.channelGui[j].level);
            view3D.updateLuts(volume);
          };
        })(i)
      );

    f.add(myState.infoObj.channelGui[i], "level")
      .max(1.0)
      .min(0.0)
      .step(0.001)
      .onChange(
        (function(j) {
          return function(value) {
            volume.getChannel(j).lutGenerator_windowLevel(myState.infoObj.channelGui[j].window, value);
            view3D.updateLuts(volume);
          };
        })(i)
      );
    f.add(myState.infoObj.channelGui[i], "autoIJ");
    f.add(myState.infoObj.channelGui[i], "auto0");
    f.add(myState.infoObj.channelGui[i], "bestFit");
    f.add(myState.infoObj.channelGui[i], "pct50_98");
    f.add(myState.infoObj.channelGui[i], "glossiness")
      .max(100.0)
      .min(0.0)
      .onChange(
        (function(j) {
          return function(value) {
            view3D.updateChannelMaterial(
              volume,
              j,
              myState.infoObj.channelGui[j].colorD,
              myState.infoObj.channelGui[j].colorS,
              myState.infoObj.channelGui[j].colorE,
              myState.infoObj.channelGui[j].glossiness
            );
            view3D.updateMaterial(volume);
          };
        })(i)
      );
  }
}

function loadImageData(jsondata, volumedata) {
  const vol = new Volume(jsondata);
  myState.volume = vol;

  // tell the viewer about the image AFTER it's loaded
  //view3D.removeAllVolumes();
  //view3D.addVolume(vol);

  // get data into the image
  if (volumedata) {
    for (var i = 0; i < volumedata.length; ++i) {
      // where each volumedata element is a flat Uint8Array of xyz data
      // according to jsondata.tile_width*jsondata.tile_height*jsondata.tiles
      // (first row of first plane is the first data in
      // the layout, then second row of first plane, etc)
      vol.setChannelDataFromVolume(i, volumedata[i]);

      view3D.setVolumeRenderMode(myState.isPT ? RENDERMODE_PATHTRACE : RENDERMODE_RAYMARCH);

      view3D.removeAllVolumes();
      view3D.addVolume(vol);

      // first 3 channels for starters
      for (var ch = 0; ch < vol.num_channels; ++ch) {
        view3D.setVolumeChannelEnabled(vol, ch, ch < 3);
      }

      const mask_channel_index = jsondata.channel_names.indexOf("SEG_Memb");
      view3D.setVolumeChannelAsMask(vol, mask_channel_index);
      view3D.updateActiveChannels(vol);
      view3D.updateLuts(vol);
      view3D.updateLights(myState.lights);
      view3D.updateDensity(vol, myState.density / 100.0);
      view3D.updateExposure(myState.exposure);
    }
  } else {
    VolumeLoader.loadVolumeAtlasData(vol, jsondata.images, (url, channelIndex) => {
      vol.channels[channelIndex].lutGenerator_percentiles(0.5, 0.998);

      if (vol.loaded) {
        view3D.setVolumeRenderMode(myState.isPT ? RENDERMODE_PATHTRACE : RENDERMODE_RAYMARCH);

        view3D.removeAllVolumes();
        view3D.addVolume(vol);

        // first 3 channels for starters
        for (var ch = 0; ch < vol.num_channels; ++ch) {
          view3D.setVolumeChannelEnabled(vol, ch, ch < 3);
        }

        view3D.setVolumeChannelAsMask(vol, jsondata.channel_names.indexOf("SEG_Memb"));
        view3D.updateActiveChannels(vol);
        view3D.updateLuts(vol);
        view3D.updateLights(myState.lights);
        view3D.updateDensity(vol, myState.density / 100.0);
        view3D.updateExposure(myState.exposure);

        // apply a volume transform from an external source:
        if (jsondata.userData && jsondata.userData.alignTransform) {
          view3D.setVolumeTranslation(vol, vol.voxelsToWorldSpace(jsondata.userData.alignTransform.translation));
          view3D.setVolumeRotation(vol, jsondata.userData.alignTransform.rotation);
        }
      }
    });
  }
  showChannelUI(vol);

  return vol;
}

function fetchImage(atlasUrl, baseUrl) {

  fetch(atlasUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(atlasJson) {

      if(baseUrl) {

        // if you need to adjust image paths prior to download,
        atlasJson.images.forEach( ( image ) => {
          image.name = `${ baseUrl }/${ image.name }`
        } )
      }

      let volumeData = null;
      loadImageData(atlasJson, volumeData);
    });
}

function createTestVolume() {
  const imgdata = {
    // width := original full size image width
    width: 64,
    // height := original full size image height
    height: 64,
    channels: 3,
    channel_names: ["DRAQ5", "EGFP", "SEG_Memb"],
    rows: 8,
    cols: 8,
    // tiles <= rows*cols, tiles is number of z slices
    tiles: 64,
    tile_width: 64,
    tile_height: 64,

    // These dimensions are used to prepare the raw volume arrays for rendering as tiled texture atlases
    // for webgl reasons, it is best for atlas_width and atlas_height to be <= 2048
    // and ideally a power of 2. (adjust other dimensions accordingly)
    // atlas_width === cols*tile_width
    atlas_width: 512,
    // atlas_height === rows*tile_height
    atlas_height: 512,

    pixel_size_x: 1,
    pixel_size_y: 1,
    pixel_size_z: 1,
    name: "AICS-10_5_5",
    status: "OK",
    version: "0.0.0",
    aicsImageVersion: "0.3.0",
  };
  // generate some raw volume data
  var channelVolumes = [
    VolumeMaker.createSphere(imgdata.tile_width, imgdata.tile_height, imgdata.tiles, 24),
    VolumeMaker.createTorus(imgdata.tile_width, imgdata.tile_height, imgdata.tiles, 24, 8),
    VolumeMaker.createCone(imgdata.tile_width, imgdata.tile_height, imgdata.tiles, 24, 24),
  ];
  return {
    imgdata: imgdata,
    volumedata: channelVolumes,
  };
}

function main() {
  let el = document.getElementById("volume-viewer");
  let winHeight = window.innerHeight;
  let winWidth = window.innerWidth;

  const bufferWidth = 15;
  el.style.width = winWidth - bufferWidth + "px";

  const toolHeight = 2*130;
  el.style.height = winHeight - toolHeight + "px";

  view3D = new View3d(el);

  const xbtn = document.getElementById( "X" );
  xbtn.addEventListener("click", () => {
    view3D.setCameraMode("X");
  });
  const ybtn = document.getElementById("Y");
  ybtn.addEventListener("click", () => {
    view3D.setCameraMode("Y");
  });
  const zbtn = document.getElementById("Z");
  zbtn.addEventListener("click", () => {
    view3D.setCameraMode("Z");
  });
  const d3btn = document.getElementById("3D");
  d3btn.addEventListener("click", () => {
    view3D.setCameraMode("3D");
  });
  const rotbtn = document.getElementById("rotbtn");
  rotbtn.addEventListener("click", () => {
    myState.isTurntable = !myState.isTurntable;
    view3D.setAutoRotate(myState.isTurntable);
  });
  const axisbtn = document.getElementById("axisbtn");
  axisbtn.addEventListener("click", () => {
    myState.isAxisShowing = !myState.isAxisShowing;
    view3D.setShowAxis(myState.isAxisShowing);
  });
  const flipxbtn = document.getElementById("flipxbtn");
  flipxbtn.addEventListener("click", () => {
    myState.flipX *= -1;
    view3D.setFlipVolume(myState.volume, myState.flipX, myState.flipY, myState.flipZ);
  });
  const flipybtn = document.getElementById("flipybtn");
  flipybtn.addEventListener("click", () => {
    myState.flipY *= -1;
    view3D.setFlipVolume(myState.volume, myState.flipX, myState.flipY, myState.flipZ);
  });
  const flipzbtn = document.getElementById("flipzbtn");
  flipzbtn.addEventListener("click", () => {
    myState.flipZ *= -1;
    view3D.setFlipVolume(myState.volume, myState.flipX, myState.flipY, myState.flipZ);
  });

  const alignbtn = document.getElementById("xfbtn");
  alignbtn.addEventListener("click", () => {
    myState.isAligned = !myState.isAligned;
    view3D.setVolumeTranslation(myState.volume, myState.isAligned ? myState.volume.getTranslation() : [0, 0, 0]);
    view3D.setVolumeRotation(myState.volume, myState.isAligned ? myState.volume.getRotation() : [0, 0, 0]);
  });
  const resetcambtn = document.getElementById("resetcambtn");
  resetcambtn.addEventListener("click", () => {
    view3D.resetCamera();
  });
  const counterspan = document.getElementById("counter");
  view3D.setRenderUpdateListener(count => {
    counterspan.innerHTML = "" + count;
  });

  if (view3D.canvas3d.hasWebGL2) {
    const ptbtn = document.getElementById("ptbtn");
    ptbtn.disabled = false;
    ptbtn.style.disabled = false;
    ptbtn.addEventListener("click", () => {
      myState.isPT = !myState.isPT;
      view3D.setVolumeRenderMode(myState.isPT ? RENDERMODE_PATHTRACE : RENDERMODE_RAYMARCH);
      view3D.updateLights(myState.lights);
    });
  }
  const screenshotbtn = document.getElementById("screenshotbtn");
  screenshotbtn.addEventListener("click", () => {
    view3D.capture(dataurl => {
      const anch = document.createElement("a");
      anch.href = dataurl;
      anch.download = "screenshot.png";
      anch.click();
    });
  });

  setupGui();
  // alert( `${window.innerWidth}, ${window.innerHeight}`)
  const loadTestData = true;

  // let baseUrl = "https://omecdn.azureedge.net/atlas"
  //let baseUrl = "."
  let baseUrl = BASE_URL;

  let atlasDefUrl = `${baseUrl}/atlas-def.json`

  if (loadTestData) {

    fetch( atlasDefUrl )
      .then( (response) => {

        return response.json();

      })
      .then( (atlasDefJson) => {

        let fullpathFilenames = [];
        atlasDefJson.filenames.forEach( (filename) => {
          let fullpath = `${baseUrl}/${filename}`;
          fullpathFilenames.push( fullpath );
        });
        atlasDefJson.filenames = fullpathFilenames;

        let atlasFilename = `${atlasDefJson.filenames[ 0 ]}`;

        fetchImage( atlasFilename, baseUrl );
        // fetchImage("AICS-10_5_5.ome.tif_atlas.json");

      });



  } else {
    const volumeinfo = createTestVolume();
    loadImageData(volumeinfo.imgdata, volumeinfo.volumedata);
  }
}

document.body.onload = () => {
  main();
};
