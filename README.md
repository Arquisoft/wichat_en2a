# wichat_en2a

[![Actions Status](https://github.com/arquisoft/wichat_en2a/workflows/CI%20for%20wichat_en2a/badge.svg)](https://github.com/arquisoft/wichat_en2a/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_en2a&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_en2a)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_en2a&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_en2a)
[![CodeScene general](https://codescene.io/images/analyzed-by-codescene-badge.svg)](https://codescene.io/projects/64832)

## Members

| Name | GitHub Profile|
|------|---------------|
|Carlos Lavilla Fernández| <a href="https://github.com/CarlosLavilla"><img src="https://img.shields.io/badge/UO287997-Carlos Lavilla-blue"></a>
|Sergio Mulet Alonso| <a href="https://github.com/SergioMulet"><img src="https://img.shields.io/badge/UO296503-Sergio Mulet-green"></a>
|Raquel Suarez Sanchez| <a href="https://github.com/RaquelSuarezSanchez"><img src="https://img.shields.io/badge/UO295000-Raquel Suarez-pink"></a>
|Omar Aguirre Rodríguez| <a href="https://github.com/OmarAguirreRguez"><img src="https://img.shields.io/badge/UO295808-Omar_Aguirre-115C14"></a>
|Ana Pérez Bango| <a href="https://github.com/AnaPB8"><img src="https://img.shields.io/badge/UO294100-Ana Pérez-purple"></a>
|Pablo Roces Pérez| <a href="https://github.com/PabloRP275"><img src="https://img.shields.io/badge/UO294656-Pablo Roces-brown"></a>
|Carlos Sampedro Menéndez| <a href="https://github.com/uo288764"><img src="https://img.shields.io/badge/UO288764-Carlos Sampedro-orange"></a>

## Quick description

<p float="left">
<img src="https://blog.wildix.com/wp-content/uploads/2020/06/react-logo.jpg" height="100">
<img src="https://miro.medium.com/max/365/1*Jr3NFSKTfQWRUyjblBSKeg.png" height="100">
</p>

This is a repository for the Wichat project of Software Architecture course in 2024/2025. It is composed of several components:

- **User service**. Express service that handles the management of users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **Question service**. Express service that handles the management of the questions of the quiz game.
- **Scheduling service**. Internal service that calls the questionservice through the gateway to update the database of questions periodically.
- **Game service**. Express service that handles the scores and leaderboard management.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the services to comunicate with each other and the webapp.
- **Webapp**. React web application that uses the gateway service to allow user interaction with the services of the application.

The application uses a Mongo database that is accessed with mongoose that contains several collections to handle each entity.

## Quick start guide

First, clone the project:

```git clone git@github.com:arquisoft/wichat_en2a.git```

### LLM API key configuration

In order to communicate with the LLM integrated in this project, we need to setup two API keys. Two integrations are necessary: gemini and empaphy.

We need to create three .env files. 
- The first one is in the webapp directory (for executing the webapp using ```npm start```). The content of this .env file should be as follows:
```
REACT_APP_LLM_API_KEY="YOUR-API-KEY"
```
- The second one is located in the root of the project (along the docker-compose.yml). This .env file is used for the docker-compose when launching the app with docker. The content of this .env file should be as follows:
```
LLM_API_KEY="YOUR-API-KEY"
GEMINI_KEY="YOUR-API-KEY"
EMPATHY_KEY="YOUR-API-KEY"
REACT_APP_LLM_API_KEY="YOUR-API-KEY"
```
- The third and last one is in the llm service folder. Its content is the following:
```
GEMINI_KEY="YOUR-API-KEY"
EMPATHY_KEY="YOUR-API-KEY"
```

Note that these files must NOT be uploaded to the github repository under any circunstance (they are excluded in the .gitignore).

An extra configuration for the LLM to work in the deployed version of the app is to include it as a repository secret (LLM_API_KEY). This secret will be used by GitHub Action when building and deploying the application.


### Launching Using docker
For launching the propotipe using docker compose, just type:
```docker compose --profile dev up --build```

### Component by component start
First, start the database. Either install and run Mongo or run it using docker:

```docker run -d -p 27017:27017 --name=my-mongo mongo:latest```

You can use also services like Mongo Altas for running a Mongo database in the cloud.

Now launch the auth, user, llm, question, game and gateway services. Just go to each directory and run `npm install` followed by `npm start`.

Lastly, go to the webapp directory and launch this component with `npm install` followed by `npm start`.

After all the components are launched, the app should be available in localhost in port 3000.

## Deployment
For the deployment, we had several options, but in the end we used an Oracle Virtual Machine with Docker to combine the use of containers with the
capabilities of a VM.

The deployment can be therefore done with a virtual machine using SSH. This will work with any cloud service (or with our own server). Other options include using the container services that all the cloud services provide. This means, deploying our Docker containers directly. Below the first of this two approaches will be used. A virtual machine will be created in a cloud service and, after installing docker and docker-compose, deploy the containers there using GitHub Actions and SSH.

### Machine requirements for deployment
The machine for deployment can be created in services like Microsoft Azure or Amazon AWS. These are in general the settings that it must have:

- Linux machine with Ubuntu > 20.04 (the recommended is 24.04).
- Docker installed.
- Open ports for the applications installed (in this case, ports 3000 for the webapp and 8000 for the gateway service).

Once you have the virtual machine created, **docker** can be installed using the following instructions:

```ssh
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt update
sudo apt install docker-ce
sudo usermod -aG docker ${USER}
```

### Continuous delivery (GitHub Actions)
Once the machine is ready, we could deploy by hand the application, taking our docker-compose file and executing it in the remote machine. In this repository, this process is done automatically using **GitHub Actions**. The idea is to trigger a series of actions when some condition is met in the repository. The precondition to trigger a deployment is going to be: "create a new release". The actions to execute are the following:

![imagen](https://github.com/user-attachments/assets/7ead6571-0f11-4070-8fe8-1bbc2e327ad2)


As it can be seen, unitary tests of each module and e2e tests are executed before pushing the docker images and deploying them. Using this approach we avoid deploying versions that do not pass the tests.

The deploy action is the following:

```yml
deploy:
    name: Deploy over SSH
    runs-on: ubuntu-latest
    needs: [docker-push-userservice,docker-push-authservice,docker-push-llmservice,docker-push-gatewayservice,docker-push-webapp]
    steps:
    - name: Deploy over SSH
      uses: fifsky/ssh-action@master
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        user: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_KEY }}
        command: |
          wget https://raw.githubusercontent.com/arquisoft/wichat_en2a/master/docker-compose.yml -O docker-compose.yml
          docker compose --profile prod down
          docker compose --profile prod up -d --pull always
```

This action uses three secrets that must be configured in the repository:
- DEPLOY_HOST: IP of the remote machine.
- DEPLOY_USER: user with permission to execute the commands in the remote machine.
- DEPLOY_KEY: key to authenticate the user in the remote machine.

Note that this action logs in the remote machine and downloads the docker-compose file from the repository and launches it. Obviously, previous actions have been executed which have uploaded the docker images to the GitHub Packages repository.
