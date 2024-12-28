#!/bin/bash
set -eu -o pipefail

this_dir=$(dirname "${BASH_SOURCE[0]}")
dist_dir=$this_dir/dist

rm -rf $dist_dir
mkdir -p $dist_dir
cp $this_dir/PKGBUILD src-tauri/target/release/bundle/deb/*.deb $dist_dir
cd $dist_dir
makepkg -si
