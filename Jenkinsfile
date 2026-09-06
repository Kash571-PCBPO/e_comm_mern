pipeline {
    agent any

    environment {
        REGISTRY       = "ghcr.io"
        BACKEND_IMAGE  = "yourgithubusername/e-comm-mern/backend"
        FRONTEND_IMAGE = "yourgithubusername/e-comm-mern/frontend"
        IMAGE_TAG      = "${env.GIT_COMMIT.take(7)}"
    }

    stages {
        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            sh 'npm test --if-present'
                        }
                    }
                }
                stage('Frontend tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
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
                    sh "docker build -t ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG} ./backend"
                    sh "docker build -t ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend"
                    sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy: dev') {
            when { branch 'dev' }
            steps {
                withCredentials([string(credentialsId: 'mongo-uri-dev', variable: 'MONGO_URI')]) {
                    sh 'docker compose -f docker-compose.yml up -d --build'
                }
            }
        }

        stage('Deploy: qa') {
            when { branch 'qa' }
            steps {
                input message: 'Approve deploy to QA?'   // <- Jenkins' equivalent of a required reviewer
                withCredentials([string(credentialsId: 'mongo-uri-qa', variable: 'MONGO_URI')]) {
                    sh 'docker compose -f docker-compose.yml up -d --build'
                }
            }
        }

        stage('Deploy: production') {
            when { tag "v*" }
            steps {
                input message: 'Approve deploy to PRODUCTION?'
                withCredentials([string(credentialsId: 'mongo-uri-prod', variable: 'MONGO_URI')]) {
                    sh 'docker compose -f docker-compose.yml up -d --build'
                }
            }
        }
    }
}
