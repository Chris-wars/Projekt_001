apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: ${K8S_NAMESPACE}
type: Opaque
stringData:
  POSTGRES_USER: app
  POSTGRES_PASSWORD: app123
  POSTGRES_DB: topics_db
