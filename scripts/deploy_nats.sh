#!/bin/bash


check_variable() {
    if [[ -z "${!1}" ]]; then
        echo "ERROR: $1 variable must be defined, exiting"
        exit -1
    fi
}


check_variable "DOMAIN"


if [ ! -f key.pem ]; then
    echo "ERROR: key.pem file not found"
    exit -1
fi


ssh_command="ssh -o StrictHostKeyChecking=no -i key.pem azureuser@$DOMAIN"


echo "INFO: stopping already running NATS container"
$ssh_command "export PORT='$PORT' && docker compose -f nats-docker-compose.yaml down || echo 'No NATS container available to stop'"
$ssh_command "docker container prune -f || echo 'No stopped containers to delete'"

echo "INFO: SCPing nats-docker-compose.yaml and config files"
scp -i key.pem ./nats-docker-compose.yaml azureuser@$DOMAIN:/home/azureuser/nats-docker-compose.yaml
envsubst '${DOMAIN}' < ./nats_server.conf > ./nat_server.conf.tmp && mv ./nats_server.conf.tmp ./nats_server.conf
scp -i key.pem ./nats_server.conf azureuser@$DOMAIN:/home/azureuser/nats_server.conf

echo "INFO: starting NATS container"

$ssh_command "export DOMAIN='$DOMAIN' \
	&& docker compose -f nats-docker-compose.yaml up -d"
