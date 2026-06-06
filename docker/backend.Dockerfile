FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm install --workspace @fnp/backend
COPY . .
RUN npm run build --workspace @fnp/backend
CMD ["npm", "run", "start:dev", "--workspace", "@fnp/backend"]
