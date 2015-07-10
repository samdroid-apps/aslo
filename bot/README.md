# ASLO Bot

The ASLO Bot builds activities and generates metadata from their code.
It is notifyed of changes via the kafka message queue and then posts
it's result on the message queue for the bot master to commit.

It runs inside a docker container.  Docker-compose does not properly
display the container's output, so it can be invoked using:

    docker-compose build
    docker run --privileged --tty -v /var/lib/docker:/var/lib/docker bot_bot
