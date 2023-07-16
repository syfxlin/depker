package main

import (
	"fmt"
	"os"
	"os/exec"
	"regexp"
)

const mod = "https://raw.githubusercontent.com/syfxlin/depker/%s/bin.ts"

func version(ver string) (bool, string) {
	if ver == "master" || ver == "latest" {
		return true, ver
	}
	ok, err := regexp.MatchString("v\\d+\\.\\d+\\.\\d+(-beta\\d+|-alpha\\d+)?", ver)
	if err != nil {
		panic(err)
	}
	if ok {
		return true, ver
	} else {
		return false, "master"
	}
}

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
	// commands
	if len(os.Args) > 1 && (os.Args[1] == "install" || os.Args[1] == "upgrade") {
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
		run("deno", append([]string{"run", "-A", fmt.Sprintf(mod, ver)}, os.Args[2:]...))
	} else {
		run("deno", append([]string{"run", "-A", fmt.Sprintf(mod, ver)}, os.Args[1:]...))
	}
}
