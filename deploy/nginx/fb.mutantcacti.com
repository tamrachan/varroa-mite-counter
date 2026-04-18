upstream varroa_backend {
	server 10.0.0.2:5555 max_fails=1 fail_timeout=5s;  # RTX 4090 WireGuard tunnel
	server 127.0.0.1:5555 backup;                       # local CPU fallback
}

server {
	server_name fb.mutantcacti.com;
	root /var/www/varroa-mite-counter/frontend;
	index index.html;

	location = /count {
		proxy_pass http://varroa_backend/count;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		client_max_body_size 60M;
		proxy_read_timeout 120s;
		proxy_connect_timeout 3s;
		proxy_next_upstream error timeout;
	}

	location / {
		try_files $uri /index.html;
	}

	listen 80;
}
