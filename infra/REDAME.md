# IaC with Terraform

## Prerequisites

### Terraform
- [Terraform](https://developer.hashicorp.com/terraform/install)

### AWS
- `~/.aws/config`
    ```
    [default]
    region = us-west-2
    aws_access_key_id = <access_key>
    aws_secret_access_key = <secret_key>
    ```

## Deploy

```bash
cd infra
```

```bash
terraform init
terraform apply
```

