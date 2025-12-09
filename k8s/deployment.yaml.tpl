apiVersion: apps/v1
kind: Deployment
metadata:
  name: topic-skill-api
  namespace: ${K8S_NAMESPACE}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: topic-skill-api
  template:
    metadata:
      labels:
        app: topic-skill-api
    spec:
      containers:
        - name: topic-skill-api
          image: ${IMAGE}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5000
              name: http
          env:
            - name: PORT
              value: "5000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-db-url
                  key: DATABASE_URL
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 30
            periodSeconds: 20
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
