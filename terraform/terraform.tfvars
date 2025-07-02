region          = "me-central-1"

vpc_cidr        = "10.0.0.0/8"
public_subnet_cidr = "10.0.1.0/24"
private_subnets_cidr = ["10.0.2.0/24", "10.0.3.0/24", "10.0.4.0/24"]
availability_zones = ["me-central-1a", "me-central-1b", "me-central-1c"]
ecs_cluster_name = "cluster-name"

domain_name     = "example.com"
