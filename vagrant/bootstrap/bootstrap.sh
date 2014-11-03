#!/usr/bin/env bash
MYSQLPASSWORD='secret'
DBNAME='wordpress'
DBUSER='root'
WP_PATH='/var/www/wordpress'
export DEBIAN_FRONTEND=noninteractive
echo "Update and install packages"
apt-get update > /dev/null
apt-get install -y apache2 git mysql-server mysql-server-5.5 php5-mysql php5 libapache2-mod-php5 > /dev/null

echo "Setting MySQL root password" 
mysqladmin -u root password $MYSQLPASSWORD > /dev/null
service apache2 restart > /dev/null

echo "Downloading and installing Wordpress"
cd /var/www > /dev/null
wget -q http://wordpress.org/latest.tar.gz > /dev/null
tar -zxvf latest.tar.gz > /dev/null
cp $WP_PATH/wp-config-sample.php $WP_PATH/wp-config.php
sed -i "s/database_name_here/$DBNAME/g" ${WP_PATH}/wp-config.php
sed -i "s/username_here/$DBUSER/g" ${WP_PATH}/wp-config.php
sed -i "s/password_here/$MYSQLPASSWORD/g" ${WP_PATH}/wp-config.php
mkdir -p ${WP_PATH}/wp-content/uploads > /dev/null
chmod 777 ${WP_PATH}/wp-content/uploads > /dev/null

echo "Creating Wordpress database"
mysql -uroot -p$MYSQLPASSWORD -e "CREATE DATABASE $DBNAME;" > /dev/null

echo "Downloading and installating the plugin"
ln -fs  /home/vagrant/src ${WP_PATH}/wp-content/plugins/eexcess > /dev/null
git clone https://github.com/EEXCESS/wordpress-plugin.git /home/vagrant/src > /dev/null

echo "Updating the datebase"
cp /home/vagrant/bootstrap/wp_db.tar.gz /var/lib/ > /dev/null
service apache2 stop > /dev/null
service mysql stop > /dev/null
rm /var/lib/mysql/ -R > /dev/null
cd /var/lib > /dev/null
tar xfvz /var/lib/wp_db.tar.gz > /dev/null
rm wp_db.tar.gz > /dev/null
service mysql start > /dev/null
service apache2 start > /dev/null

echo "done. You can now visit localhost:8888/wordpress/wp-login.php. Use 'user' as username and 'secret' password."
