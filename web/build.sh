#!/bin/sh
git pull
python compile_po.py
jekyll build

echo
echo "Site updated"
