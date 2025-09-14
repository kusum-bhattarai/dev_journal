FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's caching.
# This means 'npm install' only runs again if your dependencies change.
COPY package*.json ./

# Install all dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of source code into the container
COPY . .

# Compile TypeScript code into JavaScript. The output will be in the /dist folder.
# This command requires a "build" script in your package.json.
RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json again
COPY package*.json ./

# Install *only* the production dependencies. This makes our final image much smaller and more secure.
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the 'builder' stage into our final image
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3003

# The command to start the application when the container launches
CMD [ "node", "dist/index.js" ]
