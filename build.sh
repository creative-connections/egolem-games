#!/bin/bash
set -e
# build debug version
cordova build android
# build release
cordova build android --release
# sign release - keystore is in shared dir, prompt for password appears
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore /vagrant/egolem-keystore.jks platforms/android/app/build/outputs/bundle/release/app-release.aab egolem
cp platforms/android/app/build/outputs/bundle/release/app-release.aab /vagrant/app-release.aab
cp platforms/android/app/build/outputs/apk/debug/app-debug.apk /vagrant/app-debug.apk
