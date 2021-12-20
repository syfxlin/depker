export const supervisorConfig = () => `
[supervisord]
nodaemon=true

[program:nginx]
command=/docker-entrypoint.sh nginx -g 'daemon off;'
stopsignal=QUIT
autostart=true
autorestart=false
redirect_stderr=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:php-fpm]
command=/usr/local/bin/docker-php-entrypoint php-fpm --nodaemonize
stopsignal=QUIT
autostart=true
autorestart=false
redirect_stderr=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
`;
