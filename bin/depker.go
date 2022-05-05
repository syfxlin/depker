package main

import (
	"os"
	"os/exec"
)

var mod = "https://github.com/syfxlin/depker/raw/master/mod.ts"

func run(name string, command []string) {
	cmd := exec.Command(name, command...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			os.Exit(exitError.ExitCode())
		}
		panic(err)
	}
}

func main() {
	// proxy
	if os.Args[1] == "deno" {
		run("deno", os.Args[2:])
		return
	}
	if os.Args[1] == "docker" {
		run("docker", os.Args[2:])
		return
	}

	// command
	if os.Args[1] == "update" {
		run("deno", []string{"cache", "-r", mod})
	}

	// depker
	run("deno", append([]string{"run", "-q", "-A", mod}, os.Args[1:]...))
}
