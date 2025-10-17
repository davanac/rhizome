output "database_instance_id" {
  value       = scaleway_rdb_instance.main.id
  description = "ID of the database instance"
}

output "database_endpoint" {
  value       = scaleway_rdb_instance.main.private_network[0].ip
  description = "Database connection endpoint"
}

output "database_port" {
  value       = scaleway_rdb_instance.main.private_network[0].port
  description = "Database connection port"
}

output "database_name" {
  value       = scaleway_rdb_database.main.name
  description = "Name of the main database"
}

output "database_username" {
  value       = scaleway_rdb_user.main.name
  description = "Database username"
}

output "database_password" {
  value       = local.db_password
  description = "Database password"
  sensitive   = true
}

output "database_connection_string" {
  value       = "postgresql://${scaleway_rdb_user.main.name}:${local.db_password}@${scaleway_rdb_instance.main.private_network[0].ip}:${scaleway_rdb_instance.main.private_network[0].port}/${scaleway_rdb_database.main.name}"
  description = "Full PostgreSQL connection string"
  sensitive   = true
}

output "database_connection_params" {
  value = {
    host     = scaleway_rdb_instance.main.private_network[0].ip
    port     = scaleway_rdb_instance.main.private_network[0].port
    database = scaleway_rdb_database.main.name
    username = scaleway_rdb_user.main.name
    password = local.db_password
  }
  description = "Database connection parameters as a map"
  sensitive   = true
}

output "database_instance_name" {
  value       = scaleway_rdb_instance.main.name
  description = "Name of the database instance"
}

output "database_engine_version" {
  value       = scaleway_rdb_instance.main.engine
  description = "Database engine version"
}


output "database_backup_enabled" {
  value       = !scaleway_rdb_instance.main.disable_backup
  description = "Whether backups are enabled"
}

output "database_ha_enabled" {
  value       = scaleway_rdb_instance.main.is_ha_cluster
  description = "Whether high availability is enabled"
}