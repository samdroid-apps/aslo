#!/bin/sh
git pull
cd data
git pull
cd ..

python compile_po.py
jekyll build

echo
echo "Site updated"
