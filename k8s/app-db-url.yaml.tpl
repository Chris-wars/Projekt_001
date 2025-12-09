apiVersion: v1
kind: Secret
metadata:
  name: app-db-url
  namespace: ${K8S_NAMESPACE}
type: Opaque
stringData:
  DATABASE_URL: postgresql+psycopg2://app:app123@postgres:5432/topics_db
