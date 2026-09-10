pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        BACKEND_IMAGE  = "ghcr.io/kash571-pcbpo/e-comm-mern/backend"
        FRONTEND_IMAGE = "ghcr.io/kash571-pcbpo/e-comm-mern/frontend"
        IMAGE_TAG      = ""
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = "sha-${env.GIT_COMMIT.take(7)}"
                }
            }
        }

        stage('Validate deployment config') {
            steps {
                sh 'docker compose config -q'
            }
        }

        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm test --if-present'
                        }
                    }
                }
                stage('Frontend tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm test --if-present'
                        }
                    }
                }
            }
        }

        stage('Build and push images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'ghcr-creds', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
                    sh 'echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USER --password-stdin'
                    sh "docker build -t ${env.BACKEND_IMAGE}:${env.IMAGE_TAG} ./backend"
                    sh "docker build -t ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} ./frontend"
                    sh "docker push ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                    sh "docker push ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                }
            }
        }

        stage('Deploy: dev') {
            when { branch 'dev' }
            steps {
                withCredentials([string(credentialsId: 'mongo-uri-dev', variable: 'MONGO_URI')]) {
                    sh 'docker compose pull backend frontend'
                    sh 'docker compose up -d --no-build --remove-orphans'
                }
            }
        }

        stage('Deploy: qa') {
            when { branch 'qa' }
            steps {
                input message: 'Approve deploy to QA?'
                withCredentials([string(credentialsId: 'mongo-uri-qa', variable: 'MONGO_URI')]) {
                    sh 'docker compose pull backend frontend'
                    sh 'docker compose up -d --no-build --remove-orphans'
                }
            }
        }

        stage('Deploy: production') {
            when { tag "v*" }
            steps {
                input message: 'Approve deploy to PRODUCTION?'
                withCredentials([string(credentialsId: 'mongo-uri-prod', variable: 'MONGO_URI')]) {
                    sh 'docker compose pull backend frontend'
                    sh 'docker compose up -d --no-build --remove-orphans'
                }
            }
        }
    }
}
