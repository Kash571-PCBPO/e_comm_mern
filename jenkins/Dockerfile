FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y \
	apt-transport-https \
	ca-certificates \
	curl \
	gnupg \
	lsb-release \
	docker.io \
	&& rm -rf /var/lib/apt/lists/*

RUN usermod -aG docker jenkins

USER jenkins
