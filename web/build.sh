#!/bin/sh
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
root=_site

#cd data; git pull; cd ..

rm -rf $root
mkdir $root
mkdir $root/translations
cp -r assets    $root/assets
cp -r data      $root/data

copy_files=(index.html body.html)
for file in ${copy_files[*]}; do
    cp $file $root/$file
done

sass css/index.sass $root/index.css
cat js/lib/*.js         >> $root/main.js
browserify js/main.js   >> $root/main.js

for script in preprocessor/*.py; do
    python $script $root
done
