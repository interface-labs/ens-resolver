FROM node:16

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# FROM node:16

# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install --only=production
# COPY --from=0 /usr/src/app/build ./build
EXPOSE 6971
CMD [ "npm", "start" ]
