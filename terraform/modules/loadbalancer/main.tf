resource "scaleway_lb_ip" "main" {
  zone = var.zone
  tags = var.tags
}

resource "scaleway_lb" "main" {
  name        = "${var.name_prefix}-lb"
  ip_ids      = [scaleway_lb_ip.main.id]
  zone        = var.zone
  type        = var.lb_type
  tags        = var.tags
  
  private_network {
    private_network_id = var.private_network_id
    # The load balancer will automatically get a DHCP IP from the private network
  }
}

resource "scaleway_lb_backend" "backend" {
  lb_id                   = scaleway_lb.main.id
  name                    = "${var.name_prefix}-backend"
  forward_protocol        = "tcp"
  forward_port            = var.backend_port
  proxy_protocol          = "none"
  health_check_delay      = "10s"
  health_check_timeout    = "5s"
  health_check_max_retries = 3

  health_check_http {
    uri    = "/api/v1"
    method = "GET"
  }

  # Backend IPs will be empty initially, servers will be added dynamically
  server_ips = length(var.backend_ips) > 0 ? var.backend_ips : []
}

# HTTP backend for ACME challenge
resource "scaleway_lb_backend" "http" {
  lb_id                   = scaleway_lb.main.id
  name                    = "${var.name_prefix}-http"
  forward_protocol        = "http"
  forward_port            = var.backend_port
  proxy_protocol          = "none"
  health_check_delay      = "10s"
  health_check_timeout    = "5s"
  health_check_max_retries = 3
  
  health_check_http {
    uri    = "/api/v1"
    method = "GET"
  }
  
  server_ips = length(var.backend_ips) > 0 ? var.backend_ips : []
}

resource "scaleway_lb_certificate" "cert" {
  lb_id = scaleway_lb.main.id
  name  = "${var.name_prefix}-cert"
  
  letsencrypt {
    common_name = var.domain_name
  }
}

resource "scaleway_lb_frontend" "https" {
  lb_id        = scaleway_lb.main.id
  backend_id   = scaleway_lb_backend.backend.id
  name         = "${var.name_prefix}-https"
  inbound_port = 443
  certificate_ids = [scaleway_lb_certificate.cert.id]
}

resource "scaleway_lb_frontend" "http" {
  lb_id        = scaleway_lb.main.id
  backend_id   = scaleway_lb_backend.http.id
  name         = "${var.name_prefix}-http"
  inbound_port = 80
}

# HTTP to HTTPS redirect is handled by configuring the frontend
# to redirect rather than using a separate route resource