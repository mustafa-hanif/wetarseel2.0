variable "region" {
  type        = string
  description = "AWS region to deploy resources in"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR block for the public subnet"
}

variable "private_subnets_cidr" {
  type        = list(string)
  description = "List of CIDR blocks for the private subnets"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones for subnets"
}

variable "domain_name" {
  type        = string
  description = "Domain name for ACM certificate"
}

vriable "ecs_cluster_name" {}
