#!/bin/bash
# Copyright (C) Sam Parkinson 2014
#
# This file is part of ASLO.
#
# ASLO is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ASLO is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with ASLO.  If not, see <http:#www.gnu.org/licenses/>.

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

if [ $1 == "--quick" ]
then root="."
else root="_site"
fi

# cd data; git pull; cd ..

if [ $1 != "--quick" ]
then
    rm -rf $root
    mkdir $root
    mkdir $root/translations
    cp -r assets    $root/assets
    cp -r data      $root/data

    copy_files=(index.html body.html)
    for file in ${copy_files[*]}; do
        cp $file $root/$file
    done
fi

sass css/index.sass $root/index.css
cat js/lib/*.js               >> $root/main.js
browserify js/main.js         >> $root/main.js
echo "//# sourceURL=/main.js" >> $root/main.js

for script in preprocessor/*.py; do
    python $script $root
done
