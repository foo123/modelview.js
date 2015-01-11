#!/usr/bin/env sh

###################################################
#
#   The buildtools repository is at:
#   https://github.com/foo123/scripts/buildtools
#
###################################################

# to use the python build tool do:
python ../Beeld/Beeld.py --config "./config.custom" --tasks make_js,make_min

# to use the php build tool do:
# php -f ../Beeld/Beeld.php -- --config="./config.custom"

# to use the node build tool do:
# node ../Beeld/Beeld.js --config "./config.custom"
