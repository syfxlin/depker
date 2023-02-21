# step: build
FROM golang:alpine as builder

WORKDIR /app

COPY . .

RUN go build -o depker depker.go

# step: depker
FROM alpine:latest

RUN apk add --no-cache vim nano

COPY --from=builder /app/depker /usr/local/bin/depker
RUN chmod +x /usr/local/bin/depker

CMD depker hold
