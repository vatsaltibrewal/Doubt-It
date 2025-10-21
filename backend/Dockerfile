FROM public.ecr.aws/docker/library/node:20-slim

# Add the Lambda Web Adapter binary as a Lambda extension
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# App setup
WORKDIR /var/task
ADD package.json package-lock.json ./
RUN npm ci --omit=dev
ADD . .

ENV PORT=8080
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV AWS_LWA_READINESS_CHECK_PATH=/health

# Start your normal server
CMD ["node", "index.js"]