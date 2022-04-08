go build -o bin/depker bin/depker.go

export CGO_ENABLED=0
export GOOS=windows
export GOARCH=amd64
go build -o bin/depker.exe bin/depker.go
