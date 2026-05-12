FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates awscli \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code
WORKDIR /app
COPY package.json .
RUN npm install
COPY index.js agent.js entrypoint.sh ecs-backup-auth.sh setup-env.sh ./
RUN chmod +x entrypoint.sh ecs-backup-auth.sh setup-env.sh && chown -R node:node /app
USER node
EXPOSE 5004
ENTRYPOINT []
CMD ["/bin/sh", "/app/entrypoint.sh"]
