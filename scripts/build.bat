go build -o bin/depker.exe bin/depker.go

SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64
go build -o bin/depker bin/depker.go
