package com.controlaccesomobile.camera

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class CameraXViewManager : SimpleViewManager<CameraXView>() {

    override fun getName(): String = "CameraXView"

    override fun createViewInstance(reactContext: ThemedReactContext): CameraXView {
        return CameraXView(reactContext)
    }
}
