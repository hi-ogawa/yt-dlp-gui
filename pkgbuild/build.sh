#!/bin/bash
set -eu -o pipefail

rm -rf pkgbuild/dist
mkdir -p pkgbuild/dist
cp pkgbuild/PKGBUILD src-tauri/target/release/bundle/deb/*.deb pkgbuild/dist
cd pkgbuild/dist
makepkg -si
