#!/bin/sh
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

git pull
cd data
git pull
cd ..

python compile_po.py
jekyll build

echo
echo "Site updated"
