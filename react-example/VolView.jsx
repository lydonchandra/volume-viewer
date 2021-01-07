import React, { useEffect, useRef } from "react";
import { View3d, Volume, VolumeLoader } from "../src";
import * as UtilData from "./UtilData";

const initView3D = async (view3D) => {

  const atlasJson = await UtilData.fetchAtlasJson();

  const volume = new Volume(atlasJson);

  view3D.addVolume(volume);

  VolumeLoader.loadVolumeAtlasData(volume, atlasJson.images, (url, channelIndex) => {

    volume.channels[channelIndex].lutGenerator_percentiles(0.5, 0.998);

    view3D.setVolumeChannelEnabled(volume, channelIndex, channelIndex < 3);

    view3D.updateActiveChannels(volume);

    view3D.updateLuts(volume);

  });

  // set some viewing parameters
  view3D.setCameraMode("3D");

  view3D.updateDensity(volume, 0.05);

  view3D.updateExposure(0.75);

  return volume;
}


const VolView = () => {
  const volView = useRef()

  useEffect(() => {
    const view3D = new View3d(volView.current)

    initView3D(view3D);

  }, [])

  return (
    <div style={{height: '80vh', width: '50%' }}
         ref={volView} />
  )

}

export default VolView;
