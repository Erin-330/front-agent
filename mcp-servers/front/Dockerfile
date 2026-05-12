FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates awscli curl \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
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
