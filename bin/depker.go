package main

import (
	"fmt"
	"os"
	"os/exec"
	"regexp"
)

const mod = "https://github.com/syfxlin/depker/raw/%s/mod.ts"

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

func version(version string) string {
	if version == "master" {
		return "master"
	}
	ok, err := regexp.MatchString("v\\d+\\.\\d+\\.\\d+(-beta\\d+|-alpha\\d+)?", version)
	if err != nil {
		panic(err)
	}
	if ok {
		return version
	} else {
		return ""
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
		version := version(os.Args[2])
		if version == "" {
			run("deno", []string{"cache", "-r", fmt.Sprintf(mod, "master")})
		} else {
			run("deno", []string{"cache", "-r", fmt.Sprintf(mod, version)})
		}
		return
	}

	// depker
	version := version(os.Args[1])
	if version == "" {
		run("deno", append([]string{"run", "-q", "-A", fmt.Sprintf(mod, "master")}, os.Args[1:]...))
	} else {
		run("deno", append([]string{"run", "-q", "-A", fmt.Sprintf(mod, version)}, os.Args[2:]...))
	}
}
