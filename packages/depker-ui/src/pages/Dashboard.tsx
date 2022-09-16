import React from "react";
import {
  IconCalendarStats,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconGauge,
  IconHome2,
  IconSettings,
  IconUser,
} from "@tabler/icons";
import { NavLink } from "../components/NavLink";
import { useU } from "@syfxlin/ustyled";
import { Nav } from "../components/Nav";
import { css } from "@emotion/react";
import { ServerStatus } from "../components/ServerStatus";
import { Main } from "../components/Main";
import { Header } from "../components/Header";
import { Logs } from "../components/Logs";
import { Stack } from "@mantine/core";

const menus = ["Home", "Apps", "Services", "Deploys", "Exposes", "Volumes", "Plugins", "Settings"];
const mockdata = [
  { icon: IconHome2, label: "Home" },
  { icon: IconGauge, label: "Dashboard" },
  { icon: IconDeviceDesktopAnalytics, label: "Analytics" },
  { icon: IconCalendarStats, label: "Releases" },
  { icon: IconUser, label: "Account" },
  { icon: IconFingerprint, label: "Security" },
  { icon: IconSettings, label: "Settings" },
];

export const Dashboard: React.FC = () => {
  const { u } = useU();
  const links = mockdata.map((link) => <NavLink {...link} key={link.label} action={link.label} />);
  return (
    <>
      <Nav>{links}</Nav>
      <Main>
        <Header />
        <Stack
          css={css`
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: ${u.sp(4)};
          `}
        >
          <ServerStatus />
          <Logs
            title="Access Logs"
            index={1}
            data={`2022-09-10T14:26:36.5323797Z Requested labels: ubuntu-latest
2022-09-10T14:26:36.5323842Z Job defined at: syfxlin/home/.github/workflows/pages.yml@refs/heads/master
2022-09-10T14:26:36.5323862Z Waiting for a runner to pick up this job...
2022-09-10T14:26:37.1177686Z Job is waiting for a hosted runner to come online.
2022-09-10T14:26:39.2810979Z Job is about to start running on the hosted runner: Hosted Agent (hosted)
2022-09-10T14:26:41.1656942Z Current runner version: '2.296.1'
2022-09-10T14:26:41.1687188Z ##[group]Operating System
2022-09-10T14:26:41.1688662Z Ubuntu
2022-09-10T14:26:41.1689860Z 20.04.5
2022-09-10T14:26:41.1691095Z LTS
2022-09-10T14:26:41.1692305Z ##[endgroup]
2022-09-10T14:26:41.1693527Z ##[group]Runner Image
2022-09-10T14:26:41.1694824Z Image: ubuntu-20.04
2022-09-10T14:26:41.1696064Z Version: 20220905.1
2022-09-10T14:26:41.1697793Z Included Software: https://github.com/actions/runner-images/blob/ubuntu20/20220905.1/images/linux/Ubuntu2004-Readme.md
2022-09-10T14:26:41.1699819Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu20%2F20220905.1
2022-09-10T14:26:41.1701415Z ##[endgroup]
2022-09-10T14:26:41.1702722Z ##[group]Runner Image Provisioner
2022-09-10T14:26:41.1704033Z 1.0.0.0-main-20220825-1
2022-09-10T14:26:41.1705297Z ##[endgroup]
2022-09-10T14:26:41.1708323Z ##[group]GITHUB_TOKEN Permissions
2022-09-10T14:26:41.1710000Z Actions: write
2022-09-10T14:26:41.1711431Z Checks: write
2022-09-10T14:26:41.1712761Z Contents: write
2022-09-10T14:26:41.1713983Z Deployments: write
2022-09-10T14:26:41.1715211Z Discussions: write
2022-09-10T14:26:41.1716497Z Issues: write
2022-09-10T14:26:41.1717700Z Metadata: read
2022-09-10T14:26:41.1718927Z Packages: write
2022-09-10T14:26:41.1720164Z Pages: write
2022-09-10T14:26:41.1721401Z PullRequests: write
2022-09-10T14:26:41.1722704Z RepositoryProjects: write
2022-09-10T14:26:41.1723950Z SecurityEvents: write
2022-09-10T14:26:41.1725265Z Statuses: write
2022-09-10T14:26:41.1726540Z ##[endgroup]
2022-09-10T14:26:41.1731143Z Secret source: Actions
2022-09-10T14:26:41.1732606Z Prepare workflow directory
2022-09-10T14:26:41.2908478Z Prepare all required actions
2022-09-10T14:26:41.3092754Z Getting action download info
2022-09-10T14:26:41.5063906Z Download action repository 'actions/checkout@v2' (SHA:7884fcad6b5d53d10323aee724dc68d8b9096a2e)
2022-09-10T14:26:42.0212481Z ##[group]Checking docker version
2022-09-10T14:26:42.0234669Z ##[command]/usr/bin/docker version --format '{{.Server.APIVersion}}'
2022-09-10T14:26:42.1751748Z '1.41'
2022-09-10T14:26:42.1817820Z Docker daemon API version: '1.41'
2022-09-10T14:26:42.1819009Z ##[command]/usr/bin/docker version --format '{{.Client.APIVersion}}'
2022-09-10T14:26:42.2226061Z '1.41'
2022-09-10T14:26:42.2230643Z Docker client API version: '1.41'
2022-09-10T14:26:42.2236243Z ##[endgroup]
2022-09-10T14:26:42.2239743Z ##[group]Clean up resources from previous jobs
2022-09-10T14:26:42.2246125Z ##[command]/usr/bin/docker ps --all --quiet --no-trunc --filter "label=786a9b"
2022-09-10T14:26:42.2559846Z ##[command]/usr/bin/docker network prune --force --filter "label=786a9b"
2022-09-10T14:26:42.2872073Z ##[endgroup]
2022-09-10T14:26:42.2873041Z ##[group]Create local container network
2022-09-10T14:26:42.2885699Z ##[command]/usr/bin/docker network create --label 786a9b github_network_f4912ee64a8d4702b1514140ac4e4ba4
2022-09-10T14:26:42.3585321Z cb35e9dd24410a13d10da0760bd01d8438fdfcbf955b0aa061342ef1fb9737dd
2022-09-10T14:26:42.3610346Z ##[endgroup]
2022-09-10T14:26:42.3699357Z ##[group]Starting job container
2022-09-10T14:26:42.3724164Z ##[command]/usr/bin/docker --config /home/runner/work/_temp/.docker_8dc5e0a0-d8c8-4c0b-9c4d-385bfccade57 login ghcr.io -u syfxlin --password-stdin
2022-09-10T14:26:42.6086038Z ##[command]/usr/bin/docker --config /home/runner/work/_temp/.docker_8dc5e0a0-d8c8-4c0b-9c4d-385bfccade57 pull ghcr.io/syfxlin/depker:master
2022-09-10T14:26:42.9816805Z master: Pulling from syfxlin/depker
2022-09-10T14:26:42.9837000Z 405f018f9d1d: Pulling fs layer
2022-09-10T14:26:42.9838024Z 828ad6fc1218: Pulling fs layer
2022-09-10T14:26:42.9838950Z 6e8191a06eec: Pulling fs layer
2022-09-10T14:26:42.9839776Z 1a949208b21f: Pulling fs layer
2022-09-10T14:26:42.9842847Z 12a27d97b384: Pulling fs layer
2022-09-10T14:26:42.9843690Z 4f4fb700ef54: Pulling fs layer
2022-09-10T14:26:42.9844524Z 1a949208b21f: Waiting
2022-09-10T14:26:42.9845337Z 12a27d97b384: Waiting
2022-09-10T14:26:42.9846165Z 4f4fb700ef54: Waiting
2022-09-10T14:26:43.4564581Z 828ad6fc1218: Verifying Checksum
2022-09-10T14:26:43.4565907Z 828ad6fc1218: Download complete
2022-09-10T14:26:43.4690366Z 405f018f9d1d: Verifying Checksum
2022-09-10T14:26:43.4691933Z 405f018f9d1d: Download complete
2022-09-10T14:26:43.5703099Z 6e8191a06eec: Verifying Checksum
2022-09-10T14:26:43.5704503Z 6e8191a06eec: Download complete
2022-09-10T14:26:43.7417914Z 4f4fb700ef54: Verifying Checksum
2022-09-10T14:26:43.7419418Z 4f4fb700ef54: Download complete
2022-09-10T14:26:43.7921931Z 12a27d97b384: Verifying Checksum
2022-09-10T14:26:43.7925416Z 12a27d97b384: Download complete
2022-09-10T14:26:43.7930241Z 1a949208b21f: Verifying Checksum
2022-09-10T14:26:43.7931408Z 1a949208b21f: Download complete
2022-09-10T14:26:44.5438328Z 405f018f9d1d: Pull complete
2022-09-10T14:26:45.6215196Z 828ad6fc1218: Pull complete
2022-09-10T14:26:46.6118262Z 6e8191a06eec: Pull complete
2022-09-10T14:26:46.9108232Z 1a949208b21f: Pull complete
2022-09-10T14:26:46.9859484Z 12a27d97b384: Pull complete
2022-09-10T14:26:47.0411752Z 4f4fb700ef54: Pull complete
2022-09-10T14:26:47.0442162Z Digest: sha256:0409df8af2c1fc3aeb16b97bce2b2e17839234004746be6e2eecee9d14e1c510
2022-09-10T14:26:47.0459534Z Status: Downloaded newer image for ghcr.io/syfxlin/depker:master
2022-09-10T14:26:47.0479992Z ghcr.io/syfxlin/depker:master
2022-09-10T14:26:47.0592165Z ##[command]/usr/bin/docker create --name 476ad00eab8c4c1cb56798c88982ca12_ghcriosyfxlindepkermaster_35e678 --label 786a9b --workdir /__w/home/home --network github_network_f4912ee64a8d4702b1514140ac4e4ba4  -e "HOME" -e GITHUB_ACTIONS=true -e CI=true -v "/var/run/docker.sock":"/var/run/docker.sock" -v "/home/runner/work":"/__w" -v "/home/runner/runners/2.296.1/externals":"/__e":ro -v "/home/runner/work/_temp":"/__w/_temp" -v "/home/runner/work/_actions":"/__w/_actions" -v "/opt/hostedtoolcache":"/__t" -v "/home/runner/work/_temp/_github_home":"/github/home" -v "/home/runner/work/_temp/_github_workflow":"/github/workflow" --entrypoint "tail" ghcr.io/syfxlin/depker:master "-f" "/dev/null"
2022-09-10T14:26:47.1061482Z 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:26:47.1093575Z ##[command]/usr/bin/docker start 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:26:47.4609882Z 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:26:47.4619186Z ##[command]/usr/bin/docker ps --all --filter id=3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c --filter status=running --no-trunc --format "{{.ID}} {{.Status}}"
2022-09-10T14:26:47.4891485Z 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c Up Less than a second
2022-09-10T14:26:47.4918181Z ##[command]/usr/bin/docker inspect --format "{{range .Config.Env}}{{println .}}{{end}}" 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:26:47.5304819Z HOME=/github/home
2022-09-10T14:26:47.5305986Z GITHUB_ACTIONS=true
2022-09-10T14:26:47.5307061Z CI=true
2022-09-10T14:26:47.5308316Z PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
2022-09-10T14:26:47.5309354Z DEBIAN_FRONTEND=noninteractive
2022-09-10T14:26:47.5337410Z ##[endgroup]
2022-09-10T14:26:47.5338251Z ##[group]Waiting for all services to be ready
2022-09-10T14:26:47.5340411Z ##[endgroup]
2022-09-10T14:26:47.5740804Z ##[group]Run actions/checkout@v2
2022-09-10T14:26:47.5741612Z with:
2022-09-10T14:26:47.5742296Z   repository: syfxlin/home
2022-09-10T14:26:47.5743267Z   token: ***
2022-09-10T14:26:47.5743968Z   ssh-strict: true
2022-09-10T14:26:47.5744685Z   persist-credentials: true
2022-09-10T14:26:47.5745398Z   clean: true
2022-09-10T14:26:47.5746068Z   fetch-depth: 1
2022-09-10T14:26:47.5746937Z   lfs: false
2022-09-10T14:26:47.5747623Z   submodules: false
2022-09-10T14:26:47.5748327Z   set-safe-directory: true
2022-09-10T14:26:47.5749014Z env:
2022-09-10T14:26:47.5749691Z   TZ: Asia/Shanghai
2022-09-10T14:26:47.5750377Z ##[endgroup]
2022-09-10T14:26:47.5900011Z ##[command]/usr/bin/docker exec  3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c sh -c "cat /etc/*release | grep ^ID"
2022-09-10T14:26:48.0076928Z Syncing repository: syfxlin/home
2022-09-10T14:26:48.0079420Z ##[group]Getting Git version info
2022-09-10T14:26:48.0080423Z Working directory is '/__w/home/home'
2022-09-10T14:26:48.0081796Z ##[endgroup]
2022-09-10T14:26:48.0082667Z Deleting the contents of '/__w/home/home'
2022-09-10T14:26:48.0083576Z The repository will be downloaded using the GitHub REST API
2022-09-10T14:26:48.0084709Z To create a local Git repository instead, add Git 2.18 or higher to the PATH
2022-09-10T14:26:48.0085726Z Downloading the archive
2022-09-10T14:26:48.0344317Z (node:15) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
2022-09-10T14:26:48.3490670Z Writing archive to disk
2022-09-10T14:26:48.3544731Z Extracting the archive
2022-09-10T14:26:48.3566214Z [command]/usr/bin/tar xz -C /__w/home/home/7ab192b5-89d3-4a87-81ab-b138cdf35326 -f /__w/home/home/7ab192b5-89d3-4a87-81ab-b138cdf35326.tar.gz
2022-09-10T14:26:48.3784467Z Resolved version syfxlin-home-ef56141
2022-09-10T14:26:48.4214223Z ##[group]Run export DOCKER_HOST=***
2022-09-10T14:26:48.4215247Z [36;1mexport DOCKER_HOST=***[0m
2022-09-10T14:26:48.4216061Z [36;1mexport DOCKER_TLS_VERIFY=1[0m
2022-09-10T14:26:48.4216835Z [36;1m[0m
2022-09-10T14:26:48.4217540Z [36;1mmkdir -p ~/.docker[0m
2022-09-10T14:26:48.4218299Z [36;1mecho "$CA_PEM" > ~/.docker/ca.pem[0m
2022-09-10T14:26:48.4219143Z [36;1mecho "$CERT_PEM" > ~/.docker/cert.pem[0m
2022-09-10T14:26:48.4220000Z [36;1mecho "$KEY_PEM" > ~/.docker/key.pem[0m
2022-09-10T14:26:48.4220746Z [36;1m[0m
2022-09-10T14:26:48.4221431Z [36;1mdepker version[0m
2022-09-10T14:26:48.4222188Z [36;1mdepker deploy:up -f .depker/depker.ts[0m
2022-09-10T14:26:48.4226839Z shell: sh -e {0}
2022-09-10T14:26:48.4227530Z env:
2022-09-10T14:26:48.4228197Z   TZ: Asia/Shanghai
2022-09-10T14:26:48.4236726Z   CA_PEM: ***

2022-09-10T14:26:48.4244783Z   CERT_PEM: ***

2022-09-10T14:26:48.4259056Z   KEY_PEM: ***

2022-09-10T14:26:48.4259776Z ##[endgroup]
2022-09-10T14:26:51.7295991Z [1m[34mi [INFO] [39m[22m[34mDepker version: 2.1.1[39m
2022-09-10T14:26:51.9517933Z [1m[36m❯ [STEP] [39m[22m[36mRunning task: deploy:up[39m
2022-09-10T14:26:51.9563401Z [1m[36m❯ [STEP] [39m[22m[36mBuilding docker image: syfxlin/home:depker-1662820011955[39m
2022-09-10T14:26:52.5951504Z #2 [internal] load .dockerignore
2022-09-10T14:26:52.5953803Z #2 sha256:09104bed609f2086fc3ca815ab2985490d8c240944e2904111f63291f5eef639
2022-09-10T14:26:52.5954818Z #2 transferring context:
2022-09-10T14:26:52.8973281Z #2 transferring context: 495B 0.3s done
2022-09-10T14:26:52.8974089Z #2 DONE 0.3s
2022-09-10T14:26:52.8974465Z 
2022-09-10T14:26:52.8975461Z #1 [internal] load build definition from depker-dockerfile-b3555c88-216e-4675-a46b-f4c8ad65e691
2022-09-10T14:26:52.8976894Z #1 sha256:9986780fdd6d5c95ff79cdc61e40e4de5c46f90e8c3dd91fcba6a51fb6027ce5
2022-09-10T14:26:52.8977956Z #1 transferring dockerfile: 822B 0.3s done
2022-09-10T14:26:52.8978779Z #1 DONE 0.3s
2022-09-10T14:26:52.8979152Z 
2022-09-10T14:26:52.8979583Z #4 [internal] load metadata for docker.io/gplane/pnpm:alpine
2022-09-10T14:26:52.8980700Z #4 sha256:271d5ce37d3bcb326f6ac52c7b748cd6d724ea64e6e12e2b78b4635a70457ec1
2022-09-10T14:26:53.3492857Z #4 ...
2022-09-10T14:26:53.3493316Z 
2022-09-10T14:26:53.3493768Z #3 [internal] load metadata for docker.io/library/nginx:alpine
2022-09-10T14:26:53.3494878Z #3 sha256:b001d263a254f0e4960d52c837d5764774ef80ad3878c61304052afb6e0e9af2
2022-09-10T14:26:53.3495870Z #3 DONE 0.4s
2022-09-10T14:26:53.4999007Z 
2022-09-10T14:26:53.4999794Z #4 [internal] load metadata for docker.io/gplane/pnpm:alpine
2022-09-10T14:26:53.5001075Z #4 sha256:271d5ce37d3bcb326f6ac52c7b748cd6d724ea64e6e12e2b78b4635a70457ec1
2022-09-10T14:26:53.9044150Z #4 DONE 1.1s
2022-09-10T14:26:54.0192025Z 
2022-09-10T14:26:54.0195998Z #5 [stage-1 1/4] FROM docker.io/library/nginx:alpine@sha256:082f8c10bd47b6acc8ef15ae61ae45dd8fde0e9f389a8b5cb23c37408642bf5d
2022-09-10T14:26:54.0197747Z #5 sha256:38efb531ef5a93169577420bb35662da7ca731279d652d035ad4893f3f766049
2022-09-10T14:26:54.0198718Z #5 CACHED
2022-09-10T14:26:54.0199083Z 
2022-09-10T14:26:54.0199880Z #9 [builder 1/6] FROM docker.io/gplane/pnpm:alpine@sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584
2022-09-10T14:26:54.0201248Z #9 sha256:4868bc52179f1e3aeb3f9ce239e6a17ebba9c4cfbd1c2c37caa34b4c127f40a8
2022-09-10T14:26:54.0202686Z #9 resolve docker.io/gplane/pnpm:alpine@sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584 0.0s done
2022-09-10T14:26:54.0204232Z #9 sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584 1.37kB / 1.37kB done
2022-09-10T14:26:54.0205575Z #9 sha256:26ec127c1e50c07bc62c76cab1ac42da824f50c25bd3d5e464f4dea9846aba58 7.16kB / 7.16kB done
2022-09-10T14:26:54.0206958Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 0B / 46.26MB 0.1s
2022-09-10T14:26:54.0208311Z #9 sha256:028cf1f44ab1e1d832e34c329dfcc22800645542ab3bbbad9e7e126b411ce1f9 0B / 2.35MB 0.1s
2022-09-10T14:26:54.0209841Z #9 sha256:fd0328f6bdba7ec736a2c2f798e514297eefffd6653608e0d461799751c59837 0B / 449B 0.1s
2022-09-10T14:26:54.2863647Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 5.24MB / 46.26MB 0.3s
2022-09-10T14:26:54.4215128Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 13.63MB / 46.26MB 0.5s
2022-09-10T14:26:54.4217154Z #9 sha256:028cf1f44ab1e1d832e34c329dfcc22800645542ab3bbbad9e7e126b411ce1f9 2.35MB / 2.35MB 0.4s done
2022-09-10T14:26:54.4219001Z #9 sha256:fd0328f6bdba7ec736a2c2f798e514297eefffd6653608e0d461799751c59837 449B / 449B 0.4s done
2022-09-10T14:26:54.4220816Z #9 sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211 0B / 6.64MB 0.5s
2022-09-10T14:26:54.5717202Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 17.83MB / 46.26MB 0.6s
2022-09-10T14:26:54.7211148Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 24.12MB / 46.26MB 0.8s
2022-09-10T14:26:54.7212658Z #9 sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211 3.15MB / 6.64MB 0.8s
2022-09-10T14:26:54.8229771Z #9 sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211 5.24MB / 6.64MB 0.9s
2022-09-10T14:26:54.9716608Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 29.36MB / 46.26MB 1.0s
2022-09-10T14:26:54.9718112Z #9 sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211 6.64MB / 6.64MB 0.9s done
2022-09-10T14:26:55.1085029Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 34.60MB / 46.26MB 1.1s
2022-09-10T14:26:55.2186992Z #9 ...
2022-09-10T14:26:55.2187427Z 
2022-09-10T14:26:55.2187794Z #6 [internal] load build context
2022-09-10T14:26:55.2188794Z #6 sha256:42d702ae101ad322969102f67b47d96bbdf30e59a24bf99cbc3021a473aa571a
2022-09-10T14:26:55.2189853Z #6 transferring context: 1.71MB 1.3s done
2022-09-10T14:26:55.2190679Z #6 DONE 1.3s
2022-09-10T14:26:55.2191069Z 
2022-09-10T14:26:55.2191874Z #9 [builder 1/6] FROM docker.io/gplane/pnpm:alpine@sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584
2022-09-10T14:26:55.2193259Z #9 sha256:4868bc52179f1e3aeb3f9ce239e6a17ebba9c4cfbd1c2c37caa34b4c127f40a8
2022-09-10T14:26:55.2194596Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 38.80MB / 46.26MB 1.2s
2022-09-10T14:26:55.3696490Z #9 ...
2022-09-10T14:26:55.3696949Z 
2022-09-10T14:26:55.3698047Z #7 [stage-1 2/4] COPY .depker/tmp/nginx-template-f4cd93bf-edfe-4130-8925-ab040bbeb2bd /etc/nginx/nginx.conf
2022-09-10T14:26:55.3699435Z #7 sha256:22dafe5cd796b3f9f685444c30561d85ffa4b6f0eb796632eee3c2e246c981ba
2022-09-10T14:26:55.3700440Z #7 DONE 0.0s
2022-09-10T14:26:55.3700829Z 
2022-09-10T14:26:55.3701628Z #9 [builder 1/6] FROM docker.io/gplane/pnpm:alpine@sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584
2022-09-10T14:26:55.3703018Z #9 sha256:4868bc52179f1e3aeb3f9ce239e6a17ebba9c4cfbd1c2c37caa34b4c127f40a8
2022-09-10T14:26:55.5197913Z #9 sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 46.26MB / 46.26MB 1.4s done
2022-09-10T14:26:55.5199323Z #9 extracting sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a
2022-09-10T14:26:55.6337177Z #9 ...
2022-09-10T14:26:55.6337605Z 
2022-09-10T14:26:55.6338248Z #8 [stage-1 3/4] RUN rm -f /usr/share/nginx/html/*
2022-09-10T14:26:55.6339285Z #8 sha256:b118cc1a7ebbec5327b04dfd4df8d54b9b02e7c7c20334b5a8a67d0380deb495
2022-09-10T14:26:55.6340281Z #8 DONE 0.3s
2022-09-10T14:26:55.6340649Z 
2022-09-10T14:26:55.6341442Z #9 [builder 1/6] FROM docker.io/gplane/pnpm:alpine@sha256:159dbd714c4271ca4f9bfc682726ed4481908bb06511ad70b209269fa8a95584
2022-09-10T14:26:55.6342810Z #9 sha256:4868bc52179f1e3aeb3f9ce239e6a17ebba9c4cfbd1c2c37caa34b4c127f40a8
2022-09-10T14:26:58.2071119Z #9 extracting sha256:f65aa18165db91da3885baecdb9fd97003870a596214eae012cdad32939d951a 2.7s done
2022-09-10T14:26:58.2072531Z #9 extracting sha256:028cf1f44ab1e1d832e34c329dfcc22800645542ab3bbbad9e7e126b411ce1f9
2022-09-10T14:26:58.3361011Z #9 extracting sha256:028cf1f44ab1e1d832e34c329dfcc22800645542ab3bbbad9e7e126b411ce1f9 0.2s done
2022-09-10T14:26:58.4701516Z #9 extracting sha256:fd0328f6bdba7ec736a2c2f798e514297eefffd6653608e0d461799751c59837 done
2022-09-10T14:26:58.4702883Z #9 extracting sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211
2022-09-10T14:26:59.0373023Z #9 extracting sha256:5d2d9b31960eb4966cd470c256fefe78317403b54b1799e27eb2392a561b5211 0.4s done
2022-09-10T14:26:59.1877587Z #9 DONE 5.2s
2022-09-10T14:26:59.1878014Z 
2022-09-10T14:26:59.1878373Z #10 [builder 2/6] WORKDIR /app
2022-09-10T14:26:59.1879314Z #10 sha256:69a1fc9dacef1b8e5a0095eb46e4e5bca09a4c2b056f719fa8005aac3dcf4163
2022-09-10T14:26:59.3044540Z #10 DONE 0.1s
2022-09-10T14:26:59.3044956Z 
2022-09-10T14:26:59.3045634Z #11 [builder 3/6] COPY package.json pnpm-lock.yaml ./
2022-09-10T14:26:59.3046748Z #11 sha256:d2150b3db9134907ba53af826aefeda642affdb1939ea7c1fd148280ee629d75
2022-09-10T14:26:59.3047774Z #11 DONE 0.1s
2022-09-10T14:26:59.4547041Z 
2022-09-10T14:26:59.4547880Z #12 [builder 4/6] RUN pnpm install --frozen-lockfile
2022-09-10T14:26:59.4548972Z #12 sha256:84e21ac2eb71b5d6b7b35f3f4b84974512494da46d85bc448701b4e633558794
2022-09-10T14:27:00.7942406Z #12 1.492 Lockfile is up to date, resolution step is skipped
2022-09-10T14:27:01.0951985Z #12 1.657 Progress: resolved 1, reused 0, downloaded 0, added 0
2022-09-10T14:27:01.3964862Z #12 1.962 Packages: +676
2022-09-10T14:27:01.3965814Z #12 1.962 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
2022-09-10T14:27:01.9874799Z #12 2.685 Progress: resolved 676, reused 0, downloaded 8, added 0
2022-09-10T14:27:02.2882379Z #12 2.880 Packages are hard linked from the content-addressable store to the virtual store.
2022-09-10T14:27:02.2883773Z #12 2.880   Content-addressable store is at: /root/.local/share/pnpm/store/v3
2022-09-10T14:27:02.2884838Z #12 2.880   Virtual store is at:             node_modules/.pnpm
2022-09-10T14:27:03.0030393Z #12 3.700 Progress: resolved 676, reused 0, downloaded 39, added 34
2022-09-10T14:27:04.0232435Z #12 4.721 Progress: resolved 676, reused 0, downloaded 77, added 72
2022-09-10T14:27:05.0418871Z #12 5.740 Progress: resolved 676, reused 0, downloaded 147, added 142
2022-09-10T14:27:06.0773027Z #12 6.775 Progress: resolved 676, reused 0, downloaded 175, added 172
2022-09-10T14:27:07.0871211Z #12 7.785 Progress: resolved 676, reused 0, downloaded 226, added 225
2022-09-10T14:27:08.1400005Z #12 8.785 Progress: resolved 676, reused 0, downloaded 286, added 286
2022-09-10T14:27:09.1926082Z #12 9.795 Progress: resolved 676, reused 0, downloaded 372, added 369
2022-09-10T14:27:10.2455655Z #12 10.81 Progress: resolved 676, reused 0, downloaded 449, added 445
2022-09-10T14:27:11.1402903Z #12 11.84 Progress: resolved 676, reused 0, downloaded 492, added 490
2022-09-10T14:27:12.1453774Z #12 12.84 Progress: resolved 676, reused 0, downloaded 529, added 528
2022-09-10T14:27:13.1975929Z #12 13.84 Progress: resolved 676, reused 0, downloaded 571, added 565
2022-09-10T14:27:14.2508336Z #12 14.85 Progress: resolved 676, reused 0, downloaded 605, added 606
2022-09-10T14:27:15.3035414Z #12 15.85 Progress: resolved 676, reused 0, downloaded 636, added 632
2022-09-10T14:27:16.1754812Z #12 16.87 Progress: resolved 676, reused 0, downloaded 668, added 670
2022-09-10T14:27:17.1939872Z #12 17.88 Progress: resolved 676, reused 0, downloaded 669, added 671
2022-09-10T14:27:18.3986708Z #12 18.98 Progress: resolved 676, reused 0, downloaded 670, added 671
2022-09-10T14:27:19.2842691Z #12 19.98 Progress: resolved 676, reused 0, downloaded 671, added 673
2022-09-10T14:27:20.3371437Z #12 20.98 Progress: resolved 676, reused 0, downloaded 674, added 676, done
2022-09-10T14:27:20.7882309Z #12 21.38 .../node_modules/core-js-pure postinstall$ node -e "try{require('./postinstall')}catch(e){}"
2022-09-10T14:27:20.7883638Z #12 21.41 .../esbuild@0.12.29/node_modules/esbuild postinstall$ node install.js
2022-09-10T14:27:20.9389520Z #12 21.49 .../node_modules/core-js-pure postinstall: Thank you for using core-js ( https://github.com/zloirock/core-js ) for polyfilling JavaScript standard library!
2022-09-10T14:27:20.9391413Z #12 21.49 .../node_modules/core-js-pure postinstall: The project needs your help! Please consider supporting of core-js:
2022-09-10T14:27:20.9392913Z #12 21.49 .../node_modules/core-js-pure postinstall: > https://opencollective.com/core-js 
2022-09-10T14:27:20.9394274Z #12 21.49 .../node_modules/core-js-pure postinstall: > https://patreon.com/zloirock 
2022-09-10T14:27:20.9395576Z #12 21.49 .../node_modules/core-js-pure postinstall: > https://paypal.me/zloirock 
2022-09-10T14:27:20.9397057Z #12 21.49 .../node_modules/core-js-pure postinstall: > bitcoin: bc1qlea7544qtsmj2rayg0lthvza9fau63ux0fstcz 
2022-09-10T14:27:20.9398733Z #12 21.49 .../node_modules/core-js-pure postinstall: Also, the author of core-js ( https://github.com/zloirock ) is looking for a good job -)
2022-09-10T14:27:20.9400048Z #12 21.50 .../node_modules/core-js-pure postinstall: Done
2022-09-10T14:27:22.2876283Z #12 22.98 .../esbuild@0.12.29/node_modules/esbuild postinstall: Done
2022-09-10T14:27:22.5840819Z #12 23.28 
2022-09-10T14:27:22.5841586Z #12 23.28 dependencies:
2022-09-10T14:27:22.5842322Z #12 23.28 + @emotion/react 11.7.1
2022-09-10T14:27:22.5843123Z #12 23.28 + @emotion/serialize 1.0.2
2022-09-10T14:27:22.5844138Z #12 23.28 + @mdx-js/loader 1.6.22
2022-09-10T14:27:22.5844965Z #12 23.28 + @mdx-js/react 1.6.22
2022-09-10T14:27:22.5845754Z #12 23.28 + @next/mdx 12.0.10
2022-09-10T14:27:22.5846477Z #12 23.28 + @syfxlin/ustyled 1.2.2
2022-09-10T14:27:22.5847226Z #12 23.28 + csstype 3.0.10
2022-09-10T14:27:22.5847986Z #12 23.28 + gray-matter 4.0.3
2022-09-10T14:27:22.5848681Z #12 23.28 + next 12.0.8
2022-09-10T14:27:22.5849444Z #12 23.28 + next-mdx-remote 3.0.8
2022-09-10T14:27:22.5850256Z #12 23.28 + next-pwa 5.4.4
2022-09-10T14:27:22.5851075Z #12 23.28 + prism-react-renderer 1.3.1
2022-09-10T14:27:22.5851862Z #12 23.28 + react 17.0.2
2022-09-10T14:27:22.5852609Z #12 23.28 + react-dom 17.0.2
2022-09-10T14:27:22.5853325Z #12 23.28 
2022-09-10T14:27:22.5854003Z #12 23.28 devDependencies:
2022-09-10T14:27:22.5854713Z #12 23.28 + @babel/core 7.17.2
2022-09-10T14:27:22.5855519Z #12 23.28 + @emotion/babel-plugin 11.7.2
2022-09-10T14:27:22.5856311Z #12 23.28 + @types/react 17.0.38
2022-09-10T14:27:22.5857183Z #12 23.28 + @typescript-eslint/eslint-plugin 5.11.0
2022-09-10T14:27:22.5858132Z #12 23.28 + @typescript-eslint/parser 5.11.0
2022-09-10T14:27:22.5858928Z #12 23.28 + eslint 8.8.0
2022-09-10T14:27:22.5859715Z #12 23.28 + eslint-config-next 12.0.10
2022-09-10T14:27:22.5860571Z #12 23.28 + eslint-config-prettier 8.3.0
2022-09-10T14:27:22.5861446Z #12 23.28 + eslint-plugin-prettier 4.0.0
2022-09-10T14:27:22.5862327Z #12 23.28 + eslint-plugin-react 7.28.0
2022-09-10T14:27:22.5863208Z #12 23.28 + eslint-plugin-react-hooks 4.3.0
2022-09-10T14:27:22.5864009Z #12 23.28 + prettier 2.5.1
2022-09-10T14:27:22.5865034Z #12 23.28 + typescript 4.5.5
2022-09-10T14:27:22.5865745Z #12 23.28 + webpack 5.68.0
2022-09-10T14:27:22.5866688Z #12 23.28 
2022-09-10T14:27:22.9919319Z #12 DONE 23.6s
2022-09-10T14:27:22.9919754Z 
2022-09-10T14:27:22.9920116Z #13 [builder 5/6] COPY . .
2022-09-10T14:27:22.9922345Z #13 sha256:256e5db5b39b404cb30eae26b48f6c1ed14ef4f740d3d1a8952f53ced9516b35
2022-09-10T14:27:22.9923393Z #13 DONE 0.1s
2022-09-10T14:27:23.1425794Z 
2022-09-10T14:27:23.1436668Z #14 [builder 6/6] RUN pnpm run build
2022-09-10T14:27:23.1437706Z #14 sha256:cea80453c34c4a84ded1c1bff208eeabea6606e238fad6a0eab37632732b8623
2022-09-10T14:27:24.1560405Z #14 1.161 
2022-09-10T14:27:24.1561176Z #14 1.161 > home@0.1.0 build /app
2022-09-10T14:27:24.1561978Z #14 1.161 > next build && next export
2022-09-10T14:27:24.1562735Z #14 1.161 
2022-09-10T14:27:26.5480750Z #14 3.496 Attention: Next.js now collects completely anonymous telemetry regarding usage.
2022-09-10T14:27:26.5482334Z #14 3.497 This information is used to shape Next.js' roadmap and prioritize features.
2022-09-10T14:27:26.5484337Z #14 3.497 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
2022-09-10T14:27:26.5485608Z #14 3.497 https://nextjs.org/telemetry
2022-09-10T14:27:26.5486402Z #14 3.497 
2022-09-10T14:27:26.5487259Z #14 3.554 Browserslist: caniuse-lite is outdated. Please run:
2022-09-10T14:27:26.5488286Z #14 3.554   npx browserslist@latest --update-db
2022-09-10T14:27:26.5489611Z #14 3.554   Why you should do it regularly: https://github.com/browserslist/browserslist#browsers-data-updating
2022-09-10T14:27:26.6992066Z #14 3.625 info  - Checking validity of types...
2022-09-10T14:27:37.0371372Z #14 14.03 
2022-09-10T14:27:37.0372179Z #14 14.03 ./src/components/Footer.tsx
2022-09-10T14:27:37.0373554Z #14 14.03 5:35  Warning: 'value' is defined but never used.  @typescript-eslint/no-unused-vars
2022-09-10T14:27:37.0374598Z #14 14.03 
2022-09-10T14:27:37.0375924Z #14 14.03 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
2022-09-10T14:27:37.0377322Z #14 14.04 info  - Creating an optimized production build...
2022-09-10T14:27:37.1573757Z #14 14.09 info  - Disabled SWC as replacement for Babel because of custom Babel configuration ".babelrc" https://nextjs.org/docs/messages/swc-disabled
2022-09-10T14:27:37.1575117Z #14 14.12 > [PWA] Compile client (static)
2022-09-10T14:27:37.1576572Z #14 14.12 > [PWA] Auto register service worker with: /app/node_modules/.pnpm/next-pwa@5.4.4_fh6y5twsu2y6fgqcpxfwhs2aum/node_modules/next-pwa/register.js
2022-09-10T14:27:37.1577910Z #14 14.12 > [PWA] Service worker: /app/public/serviceworker.js
2022-09-10T14:27:37.1578883Z #14 14.12 > [PWA]   url: /serviceworker.js
2022-09-10T14:27:37.3075208Z #14 14.12 > [PWA]   scope: /
2022-09-10T14:27:37.6089267Z #14 14.50 Browserslist: caniuse-lite is outdated. Please run:
2022-09-10T14:27:37.6090369Z #14 14.50 npx browserslist@latest --update-db
2022-09-10T14:27:37.6091179Z #14 14.50 
2022-09-10T14:27:37.6091896Z #14 14.50 Why you should do it regularly:
2022-09-10T14:27:37.6092989Z #14 14.50 https://github.com/browserslist/browserslist#browsers-data-updating
2022-09-10T14:27:37.6094014Z #14 14.55 > [PWA] Compile server
2022-09-10T14:27:38.3609728Z #14 15.25 info  - Using external babel configuration from /app/.babelrc
2022-09-10T14:27:51.8872865Z #14 28.89 Browserslist: caniuse-lite is outdated. Please run:
2022-09-10T14:27:51.8873955Z #14 28.89   npx browserslist@latest --update-db
2022-09-10T14:27:51.8875283Z #14 28.89   Why you should do it regularly: https://github.com/browserslist/browserslist#browsers-data-updating
2022-09-10T14:28:11.7381522Z #14 48.64 info  - Compiled successfully
2022-09-10T14:28:11.7382459Z #14 48.64 info  - Collecting page data...
2022-09-10T14:28:20.4621911Z #14 57.41 info  - Generating static pages (0/3)
2022-09-10T14:28:21.7715648Z #14 58.72 info  - Generating static pages (3/3)
2022-09-10T14:28:21.7716638Z #14 58.74 info  - Finalizing page optimization...
2022-09-10T14:28:21.7718156Z #14 58.75 
2022-09-10T14:28:21.7718989Z #14 58.78 Page                                       Size     First Load JS
2022-09-10T14:28:21.7720199Z #14 58.78 ┌   /_app                                  0 B            85.4 kB
2022-09-10T14:28:21.7721345Z #14 58.78 ├ ● /[[...slug]] (1114 ms)                 34 kB           119 kB
2022-09-10T14:28:21.7722312Z #14 58.78 ├   └ / (1114 ms)
2022-09-10T14:28:21.7723206Z #14 58.78 └ ○ /404                                   2.84 kB        88.3 kB
2022-09-10T14:28:21.7725932Z #14 58.78 + First Load JS shared by all              85.4 kB
2022-09-10T14:28:21.7727022Z #14 58.78   ├ chunks/framework-98f0b4bfa7bca532.js   42 kB
2022-09-10T14:28:21.7728097Z #14 58.78   ├ chunks/main-b5149bf3f7d9bb32.js        26.9 kB
2022-09-10T14:28:21.7729131Z #14 58.78   ├ chunks/pages/_app-76e5ad04755f2d4e.js  15.1 kB
2022-09-10T14:28:21.7730150Z #14 58.78   └ chunks/webpack-309fdf4f15278f83.js     1.42 kB
2022-09-10T14:28:21.7731038Z #14 58.78 
2022-09-10T14:28:21.9225807Z #14 58.78 ○  (Static)  automatically rendered as static HTML (uses no initial props)
2022-09-10T14:28:21.9227445Z #14 58.78 ●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
2022-09-10T14:28:21.9228575Z #14 58.78 
2022-09-10T14:28:24.0259978Z #14 61.03 Browserslist: caniuse-lite is outdated. Please run:
2022-09-10T14:28:24.0261079Z #14 61.03   npx browserslist@latest --update-db
2022-09-10T14:28:24.0262438Z #14 61.03   Why you should do it regularly: https://github.com/browserslist/browserslist#browsers-data-updating
2022-09-10T14:28:24.1770591Z #14 61.09 info  - using build directory: /app/.next
2022-09-10T14:28:24.1771605Z #14 61.10 info  - Copying "static build" directory
2022-09-10T14:28:24.1772852Z #14 61.11 info  - No "exportPathMap" found in "/app/next.config.js". Generating map from "./pages"
2022-09-10T14:28:24.1773995Z #14 61.11 info  - Launching 5 workers
2022-09-10T14:28:24.1774828Z #14 61.11 info  - Exporting (0/1)
2022-09-10T14:28:24.1775735Z #14 61.11 info  - Copying "public" directory
2022-09-10T14:28:24.4761049Z #14 61.48 info  - Exporting (1/1)
2022-09-10T14:28:24.7767669Z #14 61.68 Export successful. Files written to /app/out
2022-09-10T14:28:24.9279218Z #14 DONE 61.8s
2022-09-10T14:28:25.4822762Z 
2022-09-10T14:28:25.4823976Z #15 [stage-1 4/4] COPY --chown=nginx:nginx --from=builder /app/out /usr/share/nginx/html
2022-09-10T14:28:25.5176226Z #15 sha256:80956e9c03d5f249c14a450aefe65a64673727f7f2b08c9af0e448a4bf527007
2022-09-10T14:28:25.5177270Z #15 DONE 0.0s
2022-09-10T14:28:25.5177652Z 
2022-09-10T14:28:25.5178212Z #16 exporting to image
2022-09-10T14:28:25.5230554Z #16 sha256:e8c613e07b0b7ff33893b694f7759a10d42e180f2b4dc349fb57dc6b71dcab00
2022-09-10T14:28:25.5231616Z #16 exporting layers 0.0s done
2022-09-10T14:28:25.5232675Z #16 writing image sha256:da4fdff22e956c82ff4f44b47be1f37515f6e2e679cbc5ca476a04e75004563a done
2022-09-10T14:28:25.5234060Z #16 naming to docker.io/syfxlin/home:depker-1662820011955 done
2022-09-10T14:28:25.5234996Z #16 DONE 0.0s
2022-09-10T14:28:25.5285105Z [1m[32m✔ [SUCCESS] [39m[22m[32mSuccessfully build image[39m
2022-09-10T14:28:25.5286209Z [1m[34mi [INFO] [39m[22m[34mSkip push image[39m
2022-09-10T14:28:25.5298730Z [1m[36m❯ [STEP] [39m[22m[36mStop container: home[39m
2022-09-10T14:28:25.8791793Z Error response from daemon: No such container: home
2022-09-10T14:28:25.8820571Z [1m[36m❯ [STEP] [39m[22m[36mRunning container: home[39m
2022-09-10T14:28:26.2903899Z e6d50c22ef8d7532769e97485981650cd713784edfb70d19844654f8517169e4
2022-09-10T14:28:27.0762671Z [1m[32m✔ [SUCCESS] [39m[22m[32mSuccessfully run container[39m
2022-09-10T14:28:27.0768111Z [1m[36m❯ [STEP] [39m[22m[36mRemove container: home-old-1662820105529[39m
2022-09-10T14:28:27.4152235Z Error: No such container: home-old-1662820105529
2022-09-10T14:28:27.4164131Z [1m[32m✔ [SUCCESS] [39m[22m[32mSuccessfully remove container[39m
2022-09-10T14:28:27.4168865Z [1m[32m✔ [SUCCESS] [39m[22m[32mSuccessfully run task: deploy:up[39m
2022-09-10T14:28:27.4404619Z Post job cleanup.
2022-09-10T14:28:27.4413129Z ##[command]/usr/bin/docker exec  3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c sh -c "cat /etc/*release | grep ^ID"
2022-09-10T14:28:27.7388415Z Stop and remove container: 476ad00eab8c4c1cb56798c88982ca12_ghcriosyfxlindepkermaster_35e678
2022-09-10T14:28:27.7395142Z ##[command]/usr/bin/docker rm --force 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:28:27.9178821Z 3774eb5e5053046214468c601e5b7bee7945f02f2472c6bd65e5a643a14a1e7c
2022-09-10T14:28:27.9210422Z Remove container network: github_network_f4912ee64a8d4702b1514140ac4e4ba4
2022-09-10T14:28:27.9216865Z ##[command]/usr/bin/docker network rm github_network_f4912ee64a8d4702b1514140ac4e4ba4
2022-09-10T14:28:28.0506304Z github_network_f4912ee64a8d4702b1514140ac4e4ba4
2022-09-10T14:28:28.0671714Z Cleaning up orphan processes
`.split("\n")}
          />
        </Stack>
      </Main>
    </>
  );
};
