// Este script é executado pelo container mongo-rs-init
// Inicializa o Replica Set de nó único para habilitar transações ACID
// Não precisa ser modificado — a configuração vem do docker-compose.yml

// O container mongo-rs-init executa rs.initiate() via entrypoint.
// Este arquivo existe apenas como documentação do processo.
print("MongoDB Replica Set rs0 configurado.");
