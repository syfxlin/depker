FROM nginx:alpine

RUN echo "<h1>Dockerfile</h1>" > /usr/share/nginx/html/index.html
RUN chmod -R 755 /usr/share/nginx/html
COPY .env /usr/share/nginx/html/.env