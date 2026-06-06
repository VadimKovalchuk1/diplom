FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --workspace @fnp/frontend
COPY . .
RUN npm run build --workspace @fnp/frontend
CMD ["npm", "run", "dev", "--workspace", "@fnp/frontend", "--", "-H", "0.0.0.0"]
