pipeline {
    agent any

    environment {
        APP_NAME = "nextjs-app"
        COMPOSE_FILE = "docker-compose.yml"
    }

    stages {

        stage('Clone Code') {
            steps {
                git branch: 'main', url: 'https://github.com/nganesh2425-bit/hari_babu_code.git'
            }
        }

        stage('Build & Deploy') {
            steps {
                sh '''
                echo "Stopping existing containers..."
                docker compose down || true

                echo "Building and starting new containers..."
                docker compose up -d --build
                '''
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh '''
                echo "Cleaning unused images..."
                docker image prune -f
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                echo "Checking running containers..."
                docker ps | grep $APP_NAME
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful! App is running on port 9002'
        }
        failure {
            echo 'Deployment Failed! Check logs using: docker logs nextjs-app'
        }
    }
}
