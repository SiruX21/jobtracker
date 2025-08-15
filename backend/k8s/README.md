# k3s Deployment Guide for JobTrack Backend (Quart + Hypercorn)

## Prerequisites

1. **k3s Cluster**: Running k3s cluster with kubectl access
2. **GitOps Pipeline**: Your GitHub Actions workflow already pushes images to `localhost:5000/jobtrack-backend:arm64-latest`
3. **External Services**: MariaDB and Redis servers accessible from cluster
4. **Ingress Controller**: k3s includes Traefik by default (or use NGINX)

## Technology Stack

- **Quart**: Async Python web framework (Flask-compatible)
- **Granian**: Rust-based high-performance ASGI server
- **Async Support**: Better concurrency and performance
- **Same API**: All existing endpoints work without changes

## Quick Deployment Steps

### 1. Access Your GitOps-Built Image

Your GitHub Actions workflow already builds and pushes the image to your local registry:
- Image: `localhost:5000/jobtrack-backend:arm64-latest`
- No manual build needed - the image is automatically updated on git push

If you need to verify the image exists:
```bash
# Check if image is in local registry
curl -X GET http://localhost:5000/v2/jobtrack-backend/tags/list

# Or inspect the image
docker pull localhost:5000/jobtrack-backend:arm64-latest
docker images | grep jobtrack-backend
```

### 2. Update Configuration

Edit `k8s/01-configmap-secret.yaml`:
- Update database and Redis host IPs/domains
- Update URLs and domains for your environment
- Base64 encode your secrets:

```bash
# Example: Encode your secret key
echo -n "your-actual-secret-key" | base64

# Example: Encode database password
echo -n "your-db-password" | base64
```

### 3. Update Deployment Image

Edit `k8s/02-deployment.yaml`:
```yaml
image: localhost:5000/jobtrack-backend:arm64-latest  # GitOps-built image
```

### 4. Deploy to k3s

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply in order:
kubectl apply -f k8s/01-configmap-secret.yaml
kubectl apply -f k8s/02-deployment.yaml
kubectl apply -f k8s/03-service-ingress.yaml
kubectl apply -f k8s/04-autoscaling.yaml
kubectl apply -f k8s/05-network-policy.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n jobtrack

# Check services  
kubectl get svc -n jobtrack

# Check ingress (k3s uses Traefik by default)
kubectl get ingress -n jobtrack

# Check logs
kubectl logs -f deployment/jobtrack-backend -n jobtrack
```

## k3s Specific Considerations

### Traefik Ingress (Default in k3s)
If using k3s default Traefik ingress, update `k8s/03-service-ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobtrack-backend-ingress
  namespace: jobtrack
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    # CORS configuration for Traefik
    traefik.ingress.kubernetes.io/router.middlewares: jobtrack-cors@kubernetescrd
```

### Local Registry Access
k3s needs to access your local registry at `localhost:5000`. Ensure:
1. Registry is accessible from k3s nodes
2. If using containerd, add registry config:

```bash
# Add to /etc/rancher/k3s/registries.yaml
mirrors:
  "localhost:5000":
    endpoint:
      - "http://localhost:5000"
configs:
  "localhost:5000":
    tls:
      insecure_skip_verify: true

# Restart k3s
sudo systemctl restart k3s
```

## Features Included

### ✅ Production Ready
- **High Availability**: 3 replicas with anti-affinity
- **Auto Scaling**: HPA based on CPU/memory usage
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: CPU and memory constraints
- **Security**: Non-root user, security context, network policies

### ✅ Stateless Design
- **External Database**: Connects to external MariaDB
- **External Cache**: Connects to external Redis
- **Horizontal Scaling**: Can scale to 10+ instances
- **Zero Downtime**: Rolling updates with PDB

### ✅ Security
- **Network Policies**: Restrict traffic flow
- **Secrets Management**: Sensitive data in Kubernetes secrets
- **TLS Support**: Ready for HTTPS with cert-manager
- **RBAC Ready**: Can add service accounts if needed

### ✅ Monitoring Ready
- **Health Endpoints**: `/api/logos/health` for monitoring
- **Prometheus**: Ready for metrics collection
- **Logging**: Structured logging to stdout

## Customization

### Scaling
Adjust replicas in `02-deployment.yaml`:
```yaml
spec:
  replicas: 5  # Increase for more instances
```

### Resources
Adjust resource limits in `02-deployment.yaml`:
```yaml
resources:
  requests:
    memory: "512Mi"  # Increase for larger workloads
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Ingress
Update `03-service-ingress.yaml` for your ingress controller:
- Change annotations for different ingress controllers
- Update TLS configuration
- Modify CORS settings

### Auto-scaling
Adjust HPA settings in `04-autoscaling.yaml`:
```yaml
spec:
  minReplicas: 3
  maxReplicas: 20
  # Adjust CPU/memory thresholds
```

## Troubleshooting

### Check Pod Status
```bash
kubectl describe pod <pod-name> -n jobtrack
```

### Check Logs
```bash
kubectl logs -f deployment/jobtrack-backend -n jobtrack
```

### Health Check
```bash
kubectl port-forward svc/jobtrack-backend-service 8080:80 -n jobtrack
curl http://localhost:8080/api/logos/health
```

### Database Connection Issues
1. Verify network connectivity from cluster to database
2. Check security groups/firewalls
3. Verify credentials in secrets
4. Test with a debug pod:

```bash
kubectl run debug --image=mysql:8 -it --rm -- mysql -h DB_HOST -u DB_USER -p
```

### Redis Connection Issues
1. Verify Redis server accessibility
2. Check Redis authentication
3. Test with a debug pod:

```bash
kubectl run debug --image=redis:alpine -it --rm -- redis-cli -h REDIS_HOST ping
```

## Production Considerations

1. **TLS Certificates**: Use cert-manager for automatic SSL
2. **Monitoring**: Add Prometheus and Grafana
3. **Logging**: Use ELK stack or similar
4. **Backup**: Ensure database backups are configured
5. **Security**: Enable Pod Security Standards
6. **Resource Quotas**: Set namespace resource limits
7. **Network Segmentation**: Use additional network policies
