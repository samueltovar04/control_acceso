import React from 'react';
import { requireNativeComponent, View } from 'react-native';

const NativeCameraXView = requireNativeComponent('CameraXView');

export const CameraXView = (props) => {
  return <NativeCameraXView {...props} />;
};
