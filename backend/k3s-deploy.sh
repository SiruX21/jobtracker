#!/bin/bash

# k3s Deployment Script for JobTrack Backend
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check k3s
check_k3s() {
    print_step "Checking k3s installation..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        echo "k3s should provide kubectl. Check your k3s installation."
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to k3s cluster"
        echo "Make sure k3s is running: sudo systemctl status k3s"
        exit 1
    fi
    
    print_success "k3s cluster is accessible"
}

# Check local registry
check_registry() {
    print_step "Checking local registry and image..."
    
    if ! curl -fsSL http://localhost:5000/v2/ >/dev/null 2>&1; then
        print_error "Local registry at localhost:5000 is not accessible"
        echo "Make sure your registry is running and accessible from k3s nodes"
        exit 1
    fi
    
    # Check if our image exists
    if curl -fsSL "http://localhost:5000/v2/jobtrack-backend/tags/list" 2>/dev/null | grep -q "arm64-latest"; then
        print_success "GitOps image found: localhost:5000/jobtrack-backend:arm64-latest"
    else
        print_warning "GitOps image not found. Make sure your GitHub Actions workflow has run successfully."
        echo "Expected image: localhost:5000/jobtrack-backend:arm64-latest"
    fi
}

# Setup k3s registry configuration
setup_registry_config() {
    print_step "Setting up k3s registry configuration..."
    
    if [ ! -f /etc/rancher/k3s/registries.yaml ]; then
        print_warning "Registry config not found. You may need to copy k8s/registries.yaml to /etc/rancher/k3s/"
        echo "Run: sudo cp k8s/registries.yaml /etc/rancher/k3s/registries.yaml"
        echo "Then: sudo systemctl restart k3s"
    else
        print_success "Registry configuration already exists"
    fi
}

# Deploy application
deploy() {
    print_step "Deploying JobTrack Backend to k3s..."
    
    # Apply manifests
    kubectl apply -f k8s/01-configmap-secret.yaml
    kubectl apply -f k8s/02-deployment.yaml
    kubectl apply -f k8s/03-service-ingress.yaml
    kubectl apply -f k8s/04-autoscaling.yaml
    kubectl apply -f k8s/05-network-policy.yaml
    
    print_success "Deployment manifests applied"
}

# Wait for deployment
wait_for_deployment() {
    print_step "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/jobtrack-backend -n jobtrack
    print_success "Deployment is ready"
}

# Show status
show_status() {
    print_step "k3s Deployment Status:"
    
    echo -e "\n${BLUE}Nodes:${NC}"
    kubectl get nodes -o wide
    
    echo -e "\n${BLUE}Pods:${NC}"
    kubectl get pods -n jobtrack -o wide
    
    echo -e "\n${BLUE}Services:${NC}"
    kubectl get svc -n jobtrack
    
    echo -e "\n${BLUE}Ingress:${NC}"
    kubectl get ingress -n jobtrack
    
    echo -e "\n${BLUE}Traefik Services (if using Traefik):${NC}"
    kubectl get svc -n kube-system | grep traefik || echo "Traefik not found"
}

# Main function
main() {
    echo -e "${BLUE}=================================================="
    echo "    JobTrack Backend k3s Deployment"
    echo "==================================================${NC}"
    
    case "${1:-deploy}" in
        "deploy")
            check_k3s
            check_registry
            setup_registry_config
            deploy
            wait_for_deployment
            show_status
            echo ""
            print_success "Deployment completed successfully!"
            echo -e "${YELLOW}Access your app through the ingress or port-forward:${NC}"
            echo "kubectl port-forward svc/jobtrack-backend-service 8080:80 -n jobtrack"
            ;;
        "status")
            show_status
            ;;
        "logs")
            kubectl logs -f deployment/jobtrack-backend -n jobtrack
            ;;
        "cleanup")
            kubectl delete -f k8s/ --ignore-not-found=true
            print_success "Cleanup completed"
            ;;
        *)
            echo "Usage: $0 [deploy|status|logs|cleanup]"
            echo ""
            echo "Commands:"
            echo "  deploy    Deploy the application to k3s"
            echo "  status    Show deployment status"
            echo "  logs      Show application logs"
            echo "  cleanup   Remove deployment"
            exit 1
            ;;
    esac
}

main "$@"
