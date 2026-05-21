



start:
	docker-compose --env-file ./control_host.env up -d --build

stop:
	docker-compose --env-file ./control_host.env down

