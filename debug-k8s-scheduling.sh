#!/bin/bash

echo "=== Kubernetes Cluster Debugging Script ==="
echo "Date: $(date)"
echo

echo "1. Checking Node Status and Resources:"
echo "======================================"
kubectl get nodes -o wide

echo
echo "2. Node Resource Usage:"
echo "======================"
kubectl top nodes

echo
echo "3. Pod Distribution Across Nodes:"
echo "================================="
kubectl get pods --all-namespaces -o wide --field-selector=status.phase!=Succeeded | grep -v "Completed"

echo
echo "4. Node Taints:"
echo "=============="
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints

echo
echo "5. Pending Pods:"
echo "==============="
kubectl get pods --all-namespaces --field-selector=status.phase=Pending

echo
echo "6. Recent Events (Last 10 minutes):"
echo "==================================="
kubectl get events --sort-by='.firstTimestamp' | head -20

echo
echo "7. Resource Quotas:"
echo "=================="
kubectl get resourcequota --all-namespaces

echo
echo "8. Cluster Resource Summary:"
echo "==========================="
kubectl describe nodes | grep -A 5 "Allocated resources"

echo
echo "9. PodDisruptionBudgets:"
echo "======================="
kubectl get pdb --all-namespaces

echo
echo "10. Failed Pod Details (if any):"
echo "==============================="
for pod in $(kubectl get pods --all-namespaces --field-selector=status.phase=Pending -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{"\n"}{end}'); do
    namespace=$(echo $pod | cut -d' ' -f1)
    podname=$(echo $pod | cut -d' ' -f2)
    echo "--- Pod: $namespace/$podname ---"
    kubectl describe pod $podname -n $namespace | grep -A 10 "Events:"
    echo
done
