#!/usr/bin/env bash
set -e
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd "$SCRIPT_DIR"
mkdir -p ./out
cmake -B ./build
cd ./build
make
cp ./OverLaid ../out/
