# Use lightweight Node.js image as a base image
FROM node:23-slim

# Set the working directory in the container
WORKDIR /usr/src/schedulingservice

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the app source code to the working directory
COPY . .

# Run the service (no port exposed, as it's not a web service)
CMD [ "node", "scheduling-service.js" ]