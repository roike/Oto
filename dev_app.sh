#!/bin/bash
#dev_appserver.py --skip_sdk_update_check=yes --enable_sendmail=yes --datastore_path=/Users/ryuji/GoogleDrive/gaestorage/thirdpen --clear_datastore=yes dispatch.yaml app.yaml master.yaml
#dev_appserver.py --enable_sendmail=yes --datastore_path=/Users/ryuji/GoogleDrive/gaestorage/elabo-one dispatch.yaml app.yaml thirdpen.yaml
dev_appserver.py --enable_sendmail=yes --port=8082 --datastore_path=/Users/ryuji/GoogleDrive/gaestorage/elabo-one app.yaml
