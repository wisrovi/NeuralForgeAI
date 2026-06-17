# NeuralForgeAI - Frontend & API Gateway

Este repositorio contiene la interfaz de usuario y la API de control para el ecosistema NeuralForgeAI.

## Estructura
- `UI/`: Aplicación frontend en React (Vite + TypeScript).
- `api/`: API Gateway construida con FastAPI y Celery.

## Instrucciones

### Frontend (UI)
```bash
cd UI
npm install
npm run dev
```

### API Gateway
```bash
cd api
# Asegúrate de configurar control_host.env
docker-compose up -d
```

### Configuración de Red
Ambos servicios están configurados para usar la red externa `train_service`. Asegúrate de que esta red exista:
```bash
docker network create train_service
```

### Variables de Entorno
- La API usa `api/control_host.env` para configurar el acceso al cluster.
- El Frontend usa `UI/.env` para las URLs de los servicios (Vite).
