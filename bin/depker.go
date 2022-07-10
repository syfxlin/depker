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

func version(version string) (bool, string) {
	if version == "master" {
		return true, version
	}
	ok, err := regexp.MatchString("v\\d+\\.\\d+\\.\\d+(-beta\\d+|-alpha\\d+)?", version)
	if err != nil {
		panic(err)
	}
	if ok {
		return true, version
	} else {
		return false, "master"
	}
}

func main() {
	// proxy
	if len(os.Args) > 1 && os.Args[1] == "deno" {
		run("deno", os.Args[2:])
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "docker" {
		run("docker", os.Args[2:])
		return
	}

	// command
	if len(os.Args) > 1 && os.Args[1] == "update" {
		ver := "master"
		if len(os.Args) > 2 {
			_, ver = version(os.Args[2])
		}
		run("deno", []string{"cache", "-r", fmt.Sprintf(mod, ver)})
		return
	}

	// depker
	ok := false
	ver := "master"
	if len(os.Args) > 1 {
		ok, ver = version(os.Args[1])
	}
	if ok {
		run("deno", append([]string{"run", "-q", "-A", fmt.Sprintf(mod, ver)}, os.Args[2:]...))
	} else {
		run("deno", append([]string{"run", "-q", "-A", fmt.Sprintf(mod, ver)}, os.Args[1:]...))
	}
}
