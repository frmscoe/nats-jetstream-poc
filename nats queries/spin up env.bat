
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Rule-001@1.0.0 -d natsconsumerrule:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Rule-002@1.0.0 -d natsconsumerrule:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Rule-003@1.0.0 -d natsconsumerrule:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Rule-004@1.0.0 -d natsconsumerrule:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Rule-005@1.0.0 -d natsconsumerrule:latest

docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Typology-001@1.0.0 --env=RULE_NAME="Rule-001@1.0.0,Rule-002@1.0.0" -d natsprocontp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Typology-002@1.0.0 --env=RULE_NAME="Rule-002@1.0.0,Rule-003@1.0.0" -d natsprocontp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Typology-003@1.0.0 --env=RULE_NAME="Rule-003@1.0.0,Rule-004@1.0.0" -d natsprocontp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Typology-004@1.0.0 --env=RULE_NAME="Rule-004@1.0.0,Rule-005@1.0.0" -d natsprocontp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=Typology-005@1.0.0 --env=RULE_NAME="Rule-005@1.0.0,Rule-001@1.0.0" -d natsprocontp:latest

docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=TADP-001@1.0.0 --env=TYPOLOGIES="Typology-001@1.0.0,Typology-002@1.0.0,Typology-003@1.0.0,Typology-004@1.0.0,Typology-005@1.0.0" -d natsconstadp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=TADP-001@1.0.0 --env=TYPOLOGIES="Typology-001@1.0.0,Typology-002@1.0.0,Typology-003@1.0.0,Typology-004@1.0.0,Typology-005@1.0.0" -d natsconstadp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=TADP-001@1.0.0 --env=TYPOLOGIES="Typology-001@1.0.0,Typology-002@1.0.0,Typology-003@1.0.0,Typology-004@1.0.0,Typology-005@1.0.0" -d natsconstadp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=TADP-001@1.0.0 --env=TYPOLOGIES="Typology-001@1.0.0,Typology-002@1.0.0,Typology-003@1.0.0,Typology-004@1.0.0,Typology-005@1.0.0" -d natsconstadp:latest
docker run --env=SERVER_URL=host.docker.internal:4222 --env=FUNCTION_NAME=TADP-001@1.0.0 --env=TYPOLOGIES="Typology-001@1.0.0,Typology-002@1.0.0,Typology-003@1.0.0,Typology-004@1.0.0,Typology-005@1.0.0" -d natsconstadp:latest







