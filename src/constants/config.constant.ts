// language=Dockerfile
export const dockerfile = `
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
`;

// language=go
export const program = `
package main

import (
	"errors"
	"io"
	"os"
	"strings"
	"time"
)

func exist(path string) bool {
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		return false
	} else {
		return true
	}
}

func write(path string, src io.Reader) {
	dst, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	_, err = io.Copy(dst, src)
	if err != nil {
		panic(err)
	}
	defer dst.Close()
}

func read(path string, dst io.Writer) {
	src, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	_, err = io.Copy(dst, src)
	if err != nil {
		panic(err)
	}
	defer src.Close()
}

func mkdir(path string) {
	err := os.MkdirAll(path, os.ModePerm)
	if err != nil {
		panic(err)
	}
}

func list(path string) []os.DirEntry {
	entries, err := os.ReadDir(path)
	if err != nil {
		panic(err)
	}
	return entries
}

func main() {
	if len(os.Args) <= 1 {
		return
	}
	switch os.Args[1] {
	case "hold":
		time.Sleep(time.Duration(1<<63 - 1))
	case "config":
		cmd := os.Args[2]
		conf := "/config/config.yml"
		if !exist(conf) {
			write(conf, strings.NewReader("mail: admin@example.com\\npass: password"))
		}
		switch cmd {
		case "write":
			write(conf, os.Stdin)
		case "read":
			read(conf, os.Stdout)
		}
	case "file":
		cmd := os.Args[2]
		file := os.Args[3]
		switch cmd {
		case "exist":
			print(exist(file))
		case "write":
			write(file, os.Stdin)
		case "read":
			read(file, os.Stdout)
		}
	case "directory":
		cmd := os.Args[2]
		dir := os.Args[3]
		switch cmd {
		case "mkdir":
			mkdir(dir)
		case "list":
			for _, entry := range list(dir) {
				if entry.IsDir() {
					println("d:" + entry.Name())
				} else {
					println("f:" + entry.Name())
				}
			}
		}
	}
}
`;
