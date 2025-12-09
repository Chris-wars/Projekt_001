apiVersion: v1
kind: Service
metadata:
  name: topic-skill-api
  namespace: ${K8S_NAMESPACE}
spec:
  type: LoadBalancer
  selector:
    app: topic-skill-api
  ports:
    - name: http
      port: 80
      targetPort: 5000
