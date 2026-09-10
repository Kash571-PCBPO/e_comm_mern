# Kubernetes setup

This directory mirrors the current Docker Compose application:

```text
Ingress e-comm.local
  /api -> backend Service -> backend Pods
  /    -> frontend Service -> frontend Pods

backend Pods -> mongo Service -> MongoDB Pod -> mongo-data PVC
```

The first version runs MongoDB inside Kubernetes so the current project can be tested end to end. For production, use a managed MongoDB service or a MongoDB operator instead of treating a single MongoDB Pod as a highly available database.

## 1. Prerequisites

Install and verify:

```bash
kubectl version --client
kubectl kustomize version
```

You also need a Kubernetes cluster and an NGINX Ingress controller. For Minikube:

```bash
minikube start
minikube addons enable ingress
```

For Docker Desktop Kubernetes, install an NGINX Ingress controller separately if one is not already installed.

## 1.1 Connect to the control plane dashboard

The dashboard is a Kubernetes client. It does not connect directly to the frontend,
backend, or MongoDB. It connects to the Kubernetes API server, so use the same
cluster context that the dashboard uses:

```bash
kubectl config current-context
kubectl cluster-info
kubectl get nodes
```

If these commands show your control-plane cluster, this project is already connected
to it. Apply the manifests from a terminal configured for that context:

```bash
kubectl apply -k k8s
kubectl get all -n e-comm
```

Then open the dashboard and select the `e-comm` namespace. You should see the MongoDB,
backend, and frontend workloads, Services, the PVC, and the Ingress. The dashboard
does not need a special project connection or URL.

To switch clusters, select the dashboard's cluster context or use kubectl explicitly:

```bash
kubectl config get-contexts
kubectl config use-context <CONTROL_PLANE_CONTEXT>
```

Do not run `kubectl apply` until `kubectl config current-context` identifies the
cluster where you intend to deploy.

## 2. Log in to GHCR

The backend and frontend images are stored in GHCR. Create the Kubernetes pull secret from the Docker login configuration. Do this on the machine where `kubectl` is configured:

```bash
docker login ghcr.io
kubectl create namespace e-comm
kubectl create secret generic ghcr-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson \
  --namespace=e-comm
```

On PowerShell, the equivalent is:

```powershell
docker login ghcr.io
kubectl create namespace e-comm
kubectl create secret generic ghcr-secret `
  --from-file=.dockerconfigjson="$HOME/.docker/config.json" `
  --type=kubernetes.io/dockerconfigjson `
  --namespace=e-comm
```

The `.dockerconfigjson` field in `secret.example.yaml` is not a file path to edit
and should not contain a real token. It is a placeholder showing the Secret type.
The commands above create the correct JSON from your local Docker login and store it
in the cluster as `ghcr-secret`. Do not apply `k8s/secret.example.yaml`.

If you must create the Secret from a JSON file, first run `docker login ghcr.io`,
then use the generated Docker configuration directly:

```bash
kubectl create secret generic ghcr-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson \
  --namespace=e-comm \
  --dry-run=client -o yaml | kubectl apply -f -
```

The GitHub PAT used by `docker login` needs `read:packages`. Never commit
`~/.docker/config.json`, a PAT, or a completed Secret manifest.

## 3. Choose the image version

`k8s/kustomization.yaml` currently selects the `latest` image tag. For a repeatable deployment, replace `latest` with the tag pushed by Jenkins, for example:

```yaml
images:
  - name: ghcr.io/kash571-pcbpo/e-comm-mern/backend
    newTag: sha-429c6e7
  - name: ghcr.io/kash571-pcbpo/e-comm-mern/frontend
    newTag: sha-429c6e7
```

Use the same commit tag for both images. Immutable commit tags make rollback possible and avoid silently changing running workloads.

## 4. Preview the resources

From the repository root:

```bash
kubectl kustomize k8s
```

This renders the Namespace, ConfigMap, MongoDB Service/Deployment/PVC, backend Service/Deployment, frontend Service/Deployment, and Ingress without changing the cluster.

## 5. Apply the application

```bash
kubectl apply -k k8s
kubectl get pods -n e-comm -w
```

The expected final state is:

```text
mongo       1/1 Running
backend     2/2 Running
frontend    2/2 Running
```

Check all resources:

```bash
kubectl get all -n e-comm
kubectl get pvc -n e-comm
kubectl get ingress -n e-comm
```

## 6. Test the API and website

The Ingress uses the host `e-comm.local`. With Minikube, get the ingress address:

```bash
minikube ip
```

Add this entry to the local hosts file, replacing the address with the Minikube IP:

```text
<MINIKUBE_IP> e-comm.local
```

On Windows, edit:

```text
C:\Windows\System32\drivers\etc\hosts
```

Then test:

```bash
curl -H "Host: e-comm.local" http://<INGRESS_ADDRESS>/api/health
curl -H "Host: e-comm.local" http://<INGRESS_ADDRESS>/
```

Open `http://e-comm.local` in a browser. The page should report `API reachable`.

If an Ingress controller is not available yet, test the services with port forwarding:

```bash
kubectl port-forward -n e-comm service/backend 5000:5000
kubectl port-forward -n e-comm service/frontend 8080:80
```

Use `http://localhost:5000/api/health` for the backend. The frontend should normally be tested through Ingress because its browser API path is `/api`.

## 7. Roll out a new Jenkins image

After Jenkins pushes a new `sha-<commit>` image:

1. Update both `newTag` values in `k8s/kustomization.yaml`.
2. Preview with `kubectl kustomize k8s`.
3. Apply with `kubectl apply -k k8s`.
4. Watch the rollout:

```bash
kubectl rollout status deployment/backend -n e-comm
kubectl rollout status deployment/frontend -n e-comm
```

Rollback if needed:

```bash
kubectl rollout undo deployment/backend -n e-comm
kubectl rollout undo deployment/frontend -n e-comm
```

## 8. Troubleshooting

```bash
kubectl describe pod -n e-comm <pod-name>
kubectl logs -n e-comm deployment/backend
kubectl logs -n e-comm deployment/frontend
kubectl describe ingress -n e-comm e-comm
kubectl get events -n e-comm --sort-by=.lastTimestamp
```

Common symptoms:

- `ImagePullBackOff`: the GHCR secret is missing, invalid, or lacks package read permission.
- Backend readiness failures: inspect backend logs and verify MongoDB is `Ready`.
- Ingress 404 or no address: install or enable an NGINX Ingress controller.
- PVC pending: the cluster has no default StorageClass; install one or configure storage for the cluster.

## What each file does

- `namespace.yaml`: isolates the application in the `e-comm` namespace.
- `configmap.yaml`: supplies the non-secret backend port and MongoDB connection string.
- `mongo.yaml`: creates MongoDB, its internal Service, and persistent storage.
- `backend.yaml`: runs two backend replicas and exposes `/api/health` for probes.
- `frontend.yaml`: runs two NGINX frontend replicas and serves the built React app.
- `ingress.yaml`: replaces the Docker reverse proxy and routes browser traffic.
- `kustomization.yaml`: combines the resources and centrally selects image tags.
- `secret.example.yaml`: documents the pull-secret shape; it must not contain real credentials.
- The dashboard uses the cluster context and Kubernetes API; it does not require a separate application connection.
