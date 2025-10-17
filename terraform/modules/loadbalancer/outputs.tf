output "lb_id" {
  description = "ID of the load balancer"
  value       = scaleway_lb.main.id
}

output "lb_public_ip" {
  description = "Public IP address of the load balancer"
  value       = scaleway_lb_ip.main.ip_address
}

output "lb_private_ips" {
  description = "Private IP addresses of the load balancer"
  value       = scaleway_lb.main.private_ips
}

output "https_endpoint" {
  description = "HTTPS endpoint URL"
  value       = "https://${var.domain_name}"
}

output "certificate_id" {
  description = "ID of the TLS certificate"
  value       = scaleway_lb_certificate.cert.id
}

output "backend_id" {
  description = "ID of the backend pool"
  value       = scaleway_lb_backend.backend.id
}

output "http_backend_id" {
  description = "ID of the HTTP backend pool"
  value       = scaleway_lb_backend.http.id
}