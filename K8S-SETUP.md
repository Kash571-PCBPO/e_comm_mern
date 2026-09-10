# Deploy this project to the remote Kubernetes cluster

This guide deploys the MERN application in this repository to the cluster whose dashboard is available at `http://167.172.77.230:32507/#/login`.

That URL is a **Kubernetes Dashboard NodePort**, not the Kubernetes API server. It is useful for viewing workloads after deployment, but it cannot configure VS Code or `kubectl` by itself. `kubectl` needs a kubeconfig file issued by the cluster administrator (or copied securely from the control-plane host).

## What is deployed

```text
Browser
  |-- Ingress (when an ingress controller exists) --> frontend Service --> React/Nginx Pods
  |                                                   |-- /api --> backend Service --> API Pods
  |
  |-- frontend NodePort (fallback) ------------------> React/Nginx Pods
                                                        |-- /api --> backend Service --> API Pods

API Pods --> mongo Service --> MongoDB Pod --> mongo-data PVC
```

The MongoDB deployment is appropriate for development and test environments. Use MongoDB Atlas, another managed database, or a properly operated MongoDB replica set before treating this as a production database.

## Files in `k8s/`

| File | Purpose |
| --- | --- |
| `namespace.yaml` | Creates the isolated `e-comm` namespace. |
| `configmap.yaml` | Supplies `PORT` and the in-cluster MongoDB connection string. |
| `mongo.yaml` | Creates MongoDB, its internal service, and a 5 GiB PVC. |
| `backend.yaml` | Runs two API replicas and exposes health probes. |
| `frontend.yaml` | Runs two frontend replicas and exposes an Ingress-facing plus NodePort service. |
| `ingress.yaml` | Routes `/api` to the API and everything else to the frontend. |
| `kustomization.yaml` | Builds the complete deployment and selects image tags. |
| `secret.example.yaml` | Documentation only; never apply it with real credentials. |

## 1. Set up access from this computer

`kubectl` v1.36.1 is already installed on this machine, but it currently has no context. Ask the cluster administrator for one of these:

1. A kubeconfig file for this cluster, with credentials that can create resources in the `e-comm` namespace; or
2. Secure SSH access to the control-plane machine, so the administrator can provide a least-privileged kubeconfig.

Do not use the dashboard's login token as a kubeconfig and do not commit a kubeconfig to this repository.

Store the supplied file outside the repository, for example at `$env:USERPROFILE\.kube\remote-e-comm.yaml`, then run this in PowerShell:

```powershell
$env:KUBECONFIG = "$env:USERPROFILE\.kube\remote-e-comm.yaml"
kubectl config get-contexts
kubectl config use-context <CONTEXT_NAME>
kubectl cluster-info
kubectl get nodes -o wide
kubectl auth can-i create deployments -n e-comm
kubectl auth can-i create secrets -n e-comm
```

Only continue when `kubectl get nodes` shows the remote nodes and both permission checks return `yes`. To make the context persistent, merge the received kubeconfig into your normal Kubernetes configuration rather than storing it in this project.

## 2. Optional VS Code setup

VS Code is not required. The required command-line tool (`kubectl`) is installed. For a convenient cluster explorer and YAML validation, install the **Kubernetes** extension by Microsoft in VS Code. It reads the same `KUBECONFIG` environment variable/context as the terminal. Restart VS Code after setting a persistent kubeconfig, then choose the remote context from the Kubernetes sidebar.

Docker Desktop is only needed on this computer if you will build and push images yourself. It is not required to apply already published images.

## 3. Publish images and choose an immutable tag

The cluster pulls these images:

```text
ghcr.io/kash571-pcbpo/e-comm-mern/backend:<TAG>
ghcr.io/kash571-pcbpo/e-comm-mern/frontend:<TAG>
```

Ensure the selected tag exists for **both** images. Jenkins currently publishes `sha-<seven-character-commit>` tags. Update both `newTag` values in `k8s/kustomization.yaml` to the same published tag before deploying. Avoid using `latest` for a repeatable deployment.

If the GHCR packages are private, create the pull secret after you have selected the remote cluster context. Use a GitHub personal access token that has `read:packages`; it does not need repository write access.

```powershell
docker login ghcr.io
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic ghcr-secret `
  --from-file=.dockerconfigjson="$env:USERPROFILE\.docker\config.json" `
  --type=kubernetes.io/dockerconfigjson `
  --namespace=e-comm `
  --dry-run=client -o yaml | kubectl apply -f -
```

If the packages are public, the secret is not needed for image access, but leaving the pull-secret reference in the workloads is harmless once the secret exists. Never commit the Docker config, a GitHub token, or a completed secret manifest.

## 4. Inspect the target cluster before deployment

Run these from the repository root:

```powershell
kubectl get storageclass
kubectl get ingressclass
kubectl get service -A
kubectl kustomize k8s
```

The PVC in `mongo.yaml` uses the default StorageClass. If no class is marked `(default)`, change `mongo.yaml` to add the appropriate `storageClassName` before applying. `ingress.yaml` expects an IngressClass named `nginx`; if the cluster uses another class, replace `ingressClassName: nginx` with the returned class name.

If there is no ingress controller, deployment still works through the frontend NodePort; skip no manifests.

## 5. Deploy

```powershell
kubectl apply -k k8s
kubectl rollout status deployment/mongo -n e-comm --timeout=180s
kubectl rollout status deployment/backend -n e-comm --timeout=180s
kubectl rollout status deployment/frontend -n e-comm --timeout=180s
kubectl get all,pvc,ingress -n e-comm
```

Expected ready workloads:

```text
deployment/mongo       1/1
deployment/backend     2/2
deployment/frontend    2/2
```

Open the supplied dashboard, log in yourself, and select namespace `e-comm` to view the deployments, pods, services, PVC, and ingress. A dashboard login does not replace the `kubectl` permissions required above.

## 6. Open the application

### Preferred: Ingress

Find the ingress controller service and its public address or NodePort:

```powershell
kubectl get service -A | Select-String -Pattern 'ingress|nginx|traefik'
kubectl get ingress e-comm -n e-comm
```

The ingress has no host restriction, so browse to the controller's public IP/DNS on its HTTP port. Once you have a domain, add a `host:` entry to `k8s/ingress.yaml`, create the matching DNS A/AAAA record, and configure TLS at the ingress controller.

### Reliable fallback: frontend NodePort

```powershell
kubectl get service frontend -n e-comm
```

Use the returned port in `http://167.172.77.230:<NODE_PORT>/`. For example, if the `PORT(S)` value is `80:31234/TCP`, open `http://167.172.77.230:31234/`. The frontend Nginx configuration proxies `/api` to the backend internally, so the website and API work through this one port. Ensure the cloud firewall permits only the NodePort you intend to expose (normally the Kubernetes NodePort range is 30000-32767).

### Validation commands

```powershell
kubectl get endpoints -n e-comm
kubectl logs deployment/backend -n e-comm --tail=100
kubectl run curl --rm -it --restart=Never -n e-comm --image=curlimages/curl -- `
  curl -fsS http://backend:5000/api/health
```

The last command must return a JSON response with `"success":true`. You can also temporarily validate without public networking:

```powershell
kubectl port-forward -n e-comm service/frontend 8080:80
```

Then open `http://localhost:8080/`; `/api` is proxied by the frontend pod.

## 7. Update and roll back

For each release, publish both images with the same immutable tag, change the two tags in `k8s/kustomization.yaml`, and apply:

```powershell
kubectl diff -k k8s
kubectl apply -k k8s
kubectl rollout status deployment/backend -n e-comm
kubectl rollout status deployment/frontend -n e-comm
```

To revert the last rollout:

```powershell
kubectl rollout undo deployment/backend -n e-comm
kubectl rollout undo deployment/frontend -n e-comm
```

For a precise rollback, change `kustomization.yaml` back to the previous known-good image tags and apply it; that also keeps Git's desired state accurate.

## 8. Troubleshooting

```powershell
kubectl get pods -n e-comm -o wide
kubectl get events -n e-comm --sort-by=.lastTimestamp
kubectl describe pod -n e-comm <POD_NAME>
kubectl logs deployment/mongo -n e-comm --tail=100
kubectl logs deployment/backend -n e-comm --tail=100
kubectl logs deployment/frontend -n e-comm --tail=100
kubectl describe ingress e-comm -n e-comm
```

| Symptom | Likely cause and correction |
| --- | --- |
| `kubectl` connects to `localhost:8080` | No current kubeconfig context. Complete step 1. |
| `ImagePullBackOff` | The tag does not exist, packages are private without `ghcr-secret`, or the secret/token lacks `read:packages`. |
| MongoDB PVC remains `Pending` | There is no usable default StorageClass. Choose one from `kubectl get storageclass` and set `storageClassName`. |
| Backend is not ready | MongoDB is not ready or `MONGO_URI` was changed incorrectly. Inspect both logs. |
| Ingress has no address or returns 404 | The controller/class is absent or does not match `ingressClassName`. Use the frontend NodePort while correcting the controller configuration. |
| NodePort times out externally | Allow the assigned NodePort in the server/cloud firewall, or expose the ingress controller instead. |

## Changes made for remote-cluster support

- `k8s/ingress.yaml` no longer requires the local-only `e-comm.local` hostname.
- `k8s/frontend.yaml` exposes a Kubernetes-assigned NodePort fallback.
- `frontend/nginx.conf` proxies `/api` to the backend so the fallback serves the complete application, not just static files.
