#!/bin/bash

# JobTrack Backend Kubernetes Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="jobtrack"
IMAGE_NAME="jobtrack-backend"
IMAGE_TAG="latest"

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    JobTrack Backend Kubernetes Deployment"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Build and push image (optional)
build_image() {
    if [ "$1" = "--build" ]; then
        print_step "Building Docker image..."
        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
        print_success "Image built successfully"
        
        if [ ! -z "$2" ]; then
            print_step "Pushing to registry $2..."
            docker tag ${IMAGE_NAME}:${IMAGE_TAG} $2/${IMAGE_NAME}:${IMAGE_TAG}
            docker push $2/${IMAGE_NAME}:${IMAGE_TAG}
            print_success "Image pushed to registry"
        fi
    fi
}

# Deploy to Kubernetes
deploy() {
    print_step "Deploying to Kubernetes..."
    
    # Apply manifests in order
    echo "Applying namespace and configuration..."
    kubectl apply -f k8s/01-configmap-secret.yaml
    
    echo "Applying deployment..."
    kubectl apply -f k8s/02-deployment.yaml
    
    echo "Applying services and ingress..."
    kubectl apply -f k8s/03-service-ingress.yaml
    
    echo "Applying autoscaling..."
    kubectl apply -f k8s/04-autoscaling.yaml
    
    echo "Applying network policies..."
    kubectl apply -f k8s/05-network-policy.yaml
    
    print_success "Deployment applied successfully"
}

# Wait for deployment
wait_for_deployment() {
    print_step "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/jobtrack-backend -n ${NAMESPACE}
    print_success "Deployment is ready"
}

# Show status
show_status() {
    print_step "Deployment Status:"
    
    echo -e "\n${BLUE}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE} -o wide
    
    echo -e "\n${BLUE}Services:${NC}"
    kubectl get svc -n ${NAMESPACE}
    
    echo -e "\n${BLUE}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n${BLUE}HPA:${NC}"
    kubectl get hpa -n ${NAMESPACE}
}

# Health check
health_check() {
    print_step "Performing health check..."
    
    # Port forward to test
    kubectl port-forward svc/jobtrack-backend-service 8080:80 -n ${NAMESPACE} &
    PF_PID=$!
    sleep 5
    
    if curl -f -s http://localhost:8080/api/logos/health > /dev/null; then
        print_success "Health check passed"
        curl -s http://localhost:8080/api/logos/health | python3 -m json.tool 2>/dev/null || echo "Health endpoint is responding"
    else
        print_warning "Health check failed or endpoint not ready yet"
    fi
    
    # Clean up port forward
    kill $PF_PID 2>/dev/null || true
}

# Cleanup function
cleanup() {
    print_step "Cleaning up deployment..."
    kubectl delete -f k8s/ --ignore-not-found=true
    print_success "Cleanup completed"
}

# Show logs
show_logs() {
    print_step "Showing recent logs..."
    kubectl logs -f deployment/jobtrack-backend -n ${NAMESPACE} --tail=50
}

# Main script
main() {
    print_banner
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            build_image $2 $3
            deploy
            wait_for_deployment
            show_status
            echo ""
            print_success "Deployment completed successfully!"
            echo -e "${YELLOW}Run './deploy.sh status' to check status${NC}"
            echo -e "${YELLOW}Run './deploy.sh health' to perform health check${NC}"
            echo -e "${YELLOW}Run './deploy.sh logs' to view logs${NC}"
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "build")
            build_image --build $2
            ;;
        *)
            echo "Usage: $0 [deploy|status|health|logs|cleanup|build]"
            echo ""
            echo "Commands:"
            echo "  deploy [--build] [registry]  Deploy the application (optionally build image)"
            echo "  status                       Show deployment status"
            echo "  health                       Perform health check"
            echo "  logs                         Show application logs"
            echo "  cleanup                      Remove deployment"
            echo "  build [registry]             Build and optionally push image"
            echo ""
            echo "Examples:"
            echo "  $0 deploy                    # Deploy with existing image"
            echo "  $0 deploy --build            # Build image and deploy"
            echo "  $0 deploy --build registry   # Build, push to registry, and deploy"
            echo "  $0 status                    # Check deployment status"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
